import './style.css';
import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter'
import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import { GlowFilter } from '@pixi/filter-glow';
import anime from 'animejs/lib/anime.es.js';

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

// CONSTANTS
const GROW_FACTOR = 3

gsap.registerPlugin(PixiPlugin);
// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);

// make a  resizing canvas with pixi
const app = new PIXI.Application<HTMLCanvasElement>({
	width: window.innerWidth,
	height: window.innerHeight,
	resizeTo: window,
	antialias: true,
	hello: true,
});

const randomFromRange = (min: number, max: number) => Math.random() * (max - min) + min;

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);



const container = new PIXI.Container();
const particleContainer =  new PIXI.ParticleContainer()
particleContainer.eventMode = 'none'
particleContainer.position = new PIXI.Point(app.screen.width / 2, app.screen.height / 2)

container.eventMode = 'static'


app.stage.addChild(container);
app.stage.addChild(particleContainer);

// particles
import particleConfig from './emitter.json'

const emitter = new particles.Emitter(
	particleContainer,
	particles.upgradeConfig(
		particleConfig,
		[PIXI.Texture.from('./assets/particle.png')]
	)
)

emitter.autoUpdate = true
emitter.emit = false

const displacementSprite = PIXI.Sprite.from('https://pixijs.com/assets/pixi-filters/displacement_map_repeat.jpg');
displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

const displacementFilter = new PIXI.DisplacementFilter(displacementSprite);
displacementFilter.padding = 20;

const glowFilter = new GlowFilter({
	color: 0x93edfd,
	quality: .05,
	innerStrength: .5,
	alpha: 0.5,
	distance: 60,
	outerStrength: 3,
})
// Make sure the sprite is wrapping.
// draw a circle using graphics
const circle = new Graphics();
const innerCircle = new Graphics();
innerCircle.beginFill('#000000', 1, true);
innerCircle.drawCircle(0, 0, 50)
innerCircle.scale.set(0)
innerCircle.alpha = 0.4
innerCircle.endFill()
innerCircle.eventMode = 'none'

innerCircle.filters = [
	new GlowFilter({
		color: 0xffffff,
		quality: .05,
		innerStrength: 2,
		alpha: 0.5,
		distance: 30,
		outerStrength: 1.5,
	})
]



circle.beginFill('#ffffff', 1, true);
circle.drawCircle(0, 0, 50);
circle.endFill();

circle.x = app.screen.width / 2;
circle.y = app.screen.height / 2;

innerCircle.position = circle.position;

circle.eventMode = 'static';
circle.cursor = 'pointer';

let growing = gsap.to([circle, innerCircle], {
	pixi: { scale: GROW_FACTOR, rotation: 60, alpha: 1 },
	duration: 1.5,
	ease: 'expo.inOut',
	paused: true,
	onUpdate: () => {
		if (growing.progress() > 0.95 && !emitter.emit) {
			emitter.emit = true
		} else if (growing.progress() < 0.95 && emitter.emit) {
			emitter.emit = false
		}
	}
});


circle.on('mouseenter', () => {
	// use gsap to animate the circle to scale up
	growing.play()
})

circle.on('mouseleave', () => {
	// use gsap to animate the circle to scale down
	growing.reverse()
})

// make the circle glow outwards
container.filters = [
	displacementFilter,
	glowFilter
];

container.alpha = 0

displacementSprite.position = circle.position;


container.addChild(circle);
container.addChild(innerCircle);
// mouse click event


app.stage.addChild(displacementSprite);

const load = async () => {
	let random = randomFromRange(0.5, 1);
	const animateGlow = () => {
		anime({
			targets: glowFilter,
			alpha: random,
			outerStrength: randomFromRange(2, 4),
			innerStrength: randomFromRange(.5, 1.5),
			duration: 150,
			easing: 'easeInOutQuad',
			complete: () => {
				random = randomFromRange(random + randomFromRange(-.2, .2), randomFromRange(0.5, 1));
				animateGlow()
			}
		})
	}

	animateGlow();

	// ticker
	app.ticker.add((delta) => {
		if (container.alpha < 1)
			container.alpha += 0.005 * delta;

		// randomize the glow filter alpha to show a flickering effect
		let now = Date.now();

		// Animate the displacement filter
		displacementSprite.angle += 0.5 * delta;
		displacementSprite.x += 1 * delta;
		// Reset x to 0 when it's over width to keep values from going to very huge numbers.
		if (displacementSprite.x > app.screen.width) {
			displacementSprite.x = 0;
		}
	});

}
load();

// @ts-ignore
globalThis.__PIXI_APP__ = app;
