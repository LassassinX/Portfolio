import './style.css';
import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter'
import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import { GlowFilter } from '@pixi/filter-glow';
import anime from 'animejs/lib/anime.es.js';

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

// CONSTANTS
const GROW_FACTOR = 5

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
const particleContainer = new PIXI.ParticleContainer()
particleContainer.eventMode = 'none'
particleContainer.position = new PIXI.Point(app.screen.width / 2, app.screen.height / 2)

container.eventMode = 'static'


app.stage.addChild(container);
app.stage.addChild(particleContainer);

// particles
import particleConfig from './emitter.json'
import outerParticleConfig from './emitter-outer.json'

const emitter = new particles.Emitter(
	particleContainer,
	particles.upgradeConfig(
		particleConfig,
		[PIXI.Texture.from('./assets/particle.png')]
	)
)

const outerEmitter = new particles.Emitter(
	particleContainer,
	particles.upgradeConfig(
		outerParticleConfig,
		[PIXI.Texture.from('./assets/particle.png')]
	)
)

emitter.autoUpdate = true
emitter.emit = false

outerEmitter.autoUpdate = true
outerEmitter.emit = false

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

let innerGlowFilter = new GlowFilter({
	color: 0xffffff,
	quality: .05,
	innerStrength: 2,
	alpha: 0.5,
	distance: 30,
	outerStrength: 1.5,
})

innerCircle.filters = [
	innerGlowFilter
]



circle.beginFill('#ffffff', 1, true);
circle.drawCircle(0, 0, 50);
circle.endFill();

circle.x = app.screen.width / 2;
circle.y = app.screen.height / 2;

innerCircle.position = circle.position;

circle.eventMode = 'static';
circle.cursor = 'pointer';
circle.alpha = 0

let growing = gsap.to([circle, innerCircle], {
	pixi: { scale: GROW_FACTOR, rotation: 60, alpha: 1 },
	duration: 1.5,
	ease: 'expo.inOut',
	paused: true,
	onUpdate: () => {
		if (growing.progress() > 0.7) {
			emitter.emit = true
			outerEmitter.emit = true
		} else {
			emitter.emit = false
			outerEmitter.emit = false
		}
	}
});
let isExploded = false
let explosion = gsap.to([circle, innerCircle], {
	pixi: { scale: 50, alpha: 1 },
	duration: 2,
	ease: 'expo.inOut',
	paused: true,
	onStart: () => {
		emitter.emit = false
		outerEmitter.emit = false
		innerGlowFilter.alpha = 0
		glowFilter.alpha = 0
		isExploded = true
	},
	onComplete: () => {
		circle.destroy()
		innerCircle.destroy()
	}
})

circle.on('mouseenter', () => {
	// use gsap to animate the circle to scale up
	if (!isExploded) {
		growing.play()
	}
})

circle.on('mouseleave', () => {
	// use gsap to animate the circle to scale down
	if (!isExploded) {
		growing.reverse()
	}
})


circle.on('mousedown', () => {
	// explode the circle
	explosion.play()
})

// make the circle glow outwards
container.filters = [
	displacementFilter,
	glowFilter
];

displacementSprite.position = circle.position;


container.addChild(circle);
container.addChild(innerCircle);

gsap.to(
	circle,
	{
		pixi: { alpha: 1 },
		duration: 1,
		ease: 'expo.inOut',
		delay: 1,
	}
)
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
		// Animate the displacement filter
		displacementSprite.angle += 0.5 * delta;
		displacementSprite.x += 2 * delta;
		// Reset x to 0 when it's over width to keep values from going to very huge numbers.
		if (displacementSprite.x > app.screen.width) {
			displacementSprite.x = 0;
		}
	});

}
load();

// @ts-ignore
globalThis.__PIXI_APP__ = app;
