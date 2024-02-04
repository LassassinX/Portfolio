import './style.css';
import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter'
import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import { GlowFilter } from '@pixi/filter-glow';
import { MotionBlurFilter } from '@pixi/filter-motion-blur';

import anime from 'animejs/lib/anime.es.js';


import { gsap } from 'gsap';
import { RoughEase } from "gsap/EasePack";


gsap.registerPlugin(RoughEase);
import { PixiPlugin } from 'gsap/PixiPlugin';


// particles
import particleConfig from './emitter.json'
import outerParticleConfig from './emitter-outer.json'

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

// make randomFromRange inclusive
const randomFromRange = (min: number, max: number) => Math.random() * (max - min) + min;


const randomFromArray = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);


const initialLoadBall = () => {
	const GROW_FACTOR = 5
	const container = new PIXI.Container();
	const particleContainer = new PIXI.ParticleContainer()
	particleContainer.eventMode = 'none'
	particleContainer.position = new PIXI.Point(app.screen.width / 2, app.screen.height / 2)

	container.eventMode = 'static'


	app.stage.addChild(container);
	app.stage.addChild(particleContainer);


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
			if (isExploded) {
				emitter.emit = false
				outerEmitter.emit = false
			} else
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

const starContainer = new PIXI.Container();
starContainer.interactiveChildren = false
starContainer.interactive = false

starContainer.width = app.screen.width
starContainer.height = app.screen.height
starContainer.name = 'starContainer'

app.stage.addChild(starContainer);
// density of stars should be based on screen size, 15 per 100000px
const STAR_COUNT = Math.floor((app.screen.width * app.screen.height)) * 18 / 100000
console.log(STAR_COUNT)

// lets make a single star
const createStar = (x: number, y: number, size: number, color: number) => {
	const star = new Graphics();
	star.beginFill(color, 1, true);
	star.drawCircle(x, y, size);
	star.cacheAsBitmap = true;
	star.endFill();
	return star;
}

const starColors = [
	0xffffff,
	0x93edfd,
	0x7E4CCB,
	// 0xF37A18,
	0x04FCFC,
]
for (let i = 0; i < STAR_COUNT; i++) {
	const color = randomFromArray(starColors), x = randomFromRange(0, app.view.width), y = randomFromRange(0, app.view.height), size = Math.floor(randomFromRange(1, 5))
	const star = createStar(x, y, size, color)
	const starSprite = new PIXI.Sprite(app.renderer.generateTexture(star));

	starSprite.alpha = randomFromRange(0.1, 0.3)
	starSprite.anchor.set(0.5);
	starSprite.x = x;
	starSprite.y = y;
	starSprite.zIndex = size;

	const finalAlpha = 1 * starSprite.zIndex / 4
	gsap.to(starSprite, {
		pixi: { alpha: finalAlpha, skewX: randomFromRange(-0.5, 0.5), skewY: randomFromRange(-0.5, 0.5) },
		duration: randomFromRange(2, 7),
		// ease: "rough({strength: 3, points: 50, template: strong.inOut, taper: both, randomize: false})",
		ease: `rough({
			template:none.out,
			strength: 1,
			points:20,
			taper:none,
			randomize:true,
			clamp:false
			})`,
		repeat: -1,
		yoyo: true,
	})

	starSprite.cullable = true
	starContainer.addChild(starSprite);
}

// keyboard
class Keyboard {
	value: string
	isDown: boolean
	isUp: boolean
	press: (() => void) | undefined
	release: (() => void) | undefined
	downHandler: (event: KeyboardEvent) => void
	upHandler: (event: KeyboardEvent) => void

	constructor(value: string) {
		this.value = value
		this.isDown = false
		this.isUp = true
		this.press = undefined
		this.release = undefined
		this.downHandler = (event: KeyboardEvent) => {
			if (event.key === this.value) {
				if (this.isUp && this.press) this.press()
				this.isDown = true
				this.isUp = false
				event.preventDefault()
			}
		}
		this.upHandler = (event: KeyboardEvent) => {
			if (event.key === this.value) {
				if (this.isDown && this.release) this.release()
				this.isDown = false
				this.isUp = true
				event.preventDefault()
			}
		}
		window.addEventListener(
			'keydown', this.downHandler.bind(this), false
		)
		window.addEventListener(
			'keyup', this.upHandler.bind(this), false
		)
	}
}

const left = new Keyboard('ArrowLeft')
const right = new Keyboard('ArrowRight')
const up = new Keyboard('ArrowUp')
const down = new Keyboard('ArrowDown')
const w = new Keyboard('w')
const a = new Keyboard('a')
const s = new Keyboard('s')
const d = new Keyboard('d')

const player = PIXI.Sprite.from('./assets/PlayerCraft.png')
player.anchor.set(0.5)
player.name = 'player'
player.roundPixels = true
const playerContainer = new PIXI.Container() as PIXI.Container & {
	velX: number,
	velY: number,
	setVelX: (vel: number) => void,
	setVelY: (vel: number) => void,
	getSpeed: () => number,
}

playerContainer.addChild(player)
playerContainer.scale.set(0.5)
playerContainer.pivot.set(player.width / 2, player.height / 2)
playerContainer.position.set(app.screen.width / 2, app.screen.height / 2)
playerContainer.name = 'playerContainer'
playerContainer.zIndex = 10

playerContainer.velX = 0
playerContainer.velY = 0

playerContainer.getSpeed = () => {
	return Math.sqrt(playerContainer.velX * playerContainer.velX + playerContainer.velY * playerContainer.velY)
}

playerContainer.filters = []

playerContainer.zIndex = 100
app.stage.addChild(playerContainer)

const bgObjectsContainer = new PIXI.Container()
bgObjectsContainer.name = 'bgObjects'
bgObjectsContainer.position.set(app.screen.width / 2, app.screen.height / 2)
app.stage.addChild(bgObjectsContainer)

// add a circle to bgObjects
const circle = new Graphics()
circle.beginFill(0xff33ef, 1, true)
circle.drawCircle(250, 600, 100)
circle.endFill()
circle.position.set(0, 0)
bgObjectsContainer.addChild(circle)


const getDistance = (a: PIXI.Container, b: PIXI.Container) => {
	const dx = a.getGlobalPosition().x - b.getGlobalPosition().x
	const dy = a.getGlobalPosition().y - b.getGlobalPosition().y
	return Math.sqrt(dx * dx + dy * dy)
}

app.ticker.add((delta) => {
	let acceleration = 0.05 * delta
	// Set your desired maximum speeds for forward and reverse
	const maxForwardSpeed = 4;
	const maxReverseSpeed = 1;
	// Inside the app.ticker.add block
	if (w.isDown || s.isDown) {
		const angle = playerContainer.rotation;
		const accelerationX = Math.sin(angle) * acceleration;
		const accelerationY = -Math.cos(angle) * acceleration;

		if (w.isDown) {
			playerContainer.velX += accelerationX;
			playerContainer.velY += accelerationY;

			// Cap the speed for forward movement
			const speed = playerContainer.getSpeed();
			if (speed > maxForwardSpeed) {
				const scale = maxForwardSpeed / speed;
				playerContainer.velX *= scale;
				playerContainer.velY *= scale;
			}
		}

		if (s.isDown) {
			playerContainer.velX -= accelerationX / 4;
			playerContainer.velY -= accelerationY / 4;

			// Cap the speed for reverse movement
			const speed = playerContainer.getSpeed();
			if (speed > maxReverseSpeed) {
				const scale = maxReverseSpeed / speed;
				playerContainer.velX *= scale;
				playerContainer.velY *= scale;
			}
		}
	} else {
		// dampen velocity
		playerContainer.velX *= 0.98;
		playerContainer.velY *= 0.98;
	}

	if (a.isDown) {
		playerContainer.angle -= 1 * delta
	}

	if (d.isDown) {
		playerContainer.angle += 1 * delta
	}

	moveStarsBg(-playerContainer.velX, -playerContainer.velY)
})

const getSpeed = (velX: number, velY: number) => Math.sqrt(velX * velX + velY * velY)
const moveStarsBg = (velX: number, velY: number) => {
	starContainer.children.forEach((star) => {

		star.x += velX * 0.05 * star.zIndex / 2
		star.y += velY * 0.05 * star.zIndex / 2

		if (star.x > app.screen.width) {
			star.x = 0
		}
		if (star.x < 0) {
			star.x = app.screen.width;
		}
		if (star.y > app.screen.height) {
			star.y = 0;
		}
		if (star.y < 0) {
			star.y = app.screen.height;
		}
	})

	bgObjectsContainer.children.forEach((bgObject) => {
		bgObject.x += velX
		bgObject.y += velY
	})
}
// initialLoadBall()
// @ts-ignore
globalThis.__PIXI_APP__ = app;
