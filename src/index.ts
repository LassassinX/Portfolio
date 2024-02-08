import './style.css';
import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter'
import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import { GlowFilter } from '@pixi/filter-glow';
import { MotionBlurFilter } from '@pixi/filter-motion-blur';

import anime from 'animejs/lib/anime.es.js';


import { gsap, wrap } from 'gsap';
import { RoughEase } from "gsap/EasePack";


gsap.registerPlugin(RoughEase);
import { PixiPlugin } from 'gsap/PixiPlugin';


// particles
import particleConfig from './emitter.json'
import outerParticleConfig from './emitter-outer.json'

gsap.registerPlugin(PixiPlugin);
// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);

// functions
// #region
const randomFromRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomFromArray = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const getDistance = (a: PIXI.Container, b: PIXI.Container) => {
	const dx = a.getGlobalPosition().x - b.getGlobalPosition().x
	const dy = a.getGlobalPosition().y - b.getGlobalPosition().y
	return Math.sqrt(dx * dx + dy * dy)
}

// lets make a single star
const createStar = (x: number, y: number, size: number, color: number) => {
	const star = new Graphics();
	star.beginFill(color, 1, true);
	star.drawCircle(x, y, size);
	star.cacheAsBitmap = true;
	star.endFill();
	return star;
}

function randChar() {
	let c = "abcdefghijklmnopqrstuvwxyz1234567890!@#$^&*()…æ_+-=;[]/~`"
	c = c[Math.floor(Math.random() * c.length)]
	return (Math.random() > 0.5) ? c : c.toUpperCase()
}

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


const _selectContainer = (display: PIXI.Container, width = true) => {
	const padding = 20

	// make a div
	const wrapper = document.createElement('div')
	const bg = document.createElement('div')
	const container = document.createElement('div')

	bg.appendChild(container)

	wrapper.classList.add('select-wrapper')
	wrapper.appendChild(bg)

	bg.classList.add('select-bg')
	container.classList.add('select-container')

	if (width) {
		container.style.width = display.width + padding + 'px'
		container.style.height = display.height + padding + 'px'
	}

	// wrapper.style.transform = `translate(${display.getGlobalPosition().x - display.width / 2 - padding / 2}px, ${display.getGlobalPosition().y - display.height / 2 - padding / 2}px)`

	return { wrapper, container, bg }
}

const _selectTextContainer = (display: PIXI.Container, texts: string[]) => {
	// make a select container 
	const { wrapper, container, bg } = _selectContainer(display, false);
	bg.classList.add('text-bg')


	const textContainer = document.createElement('div')
	textContainer.classList.add('text-container')

	texts.forEach(text => {
		const div = document.createElement('div')
		div.classList.add('text')
		div.innerHTML = text
		textContainer.appendChild(div)
	})

	container.appendChild(textContainer)


	return {
		wrapper,
		textContainer,
		container,
		bg,
	}
}

const spawnTexts = (display: PIXI.Container, texts: string[]) => {
	const parent = document.createElement('div')
	parent.classList.add('select-parent')

	const padding = 20
	const { wrapper: displayContainerWrapper, container: displayContainer } = _selectContainer(display)
	const { wrapper: textContainerWrapper, container: textContainer } = _selectTextContainer(display, texts)

	const offsetX = 25 + display.width
	const offsetY = 0

	textContainerWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`

	parent.appendChild(displayContainerWrapper)
	parent.appendChild(textContainerWrapper)

	app.ticker.add(() => {
		parent.style.transform = `translate(${display.getGlobalPosition().x - padding / 2 - display.width / 2}px, ${display.getGlobalPosition().y - display.height / 2 - padding / 2}px)`
	})

	displayContainerWrapper.style.opacity = '0'
	displayContainer.style.width = '0'
	displayContainer.style.height = '0'

	textContainerWrapper.style.opacity = '0'
	textContainer.style.width = '0'
	textContainer.style.height = '0'
	document.body.appendChild(parent)
	const w = display.width + padding + 'px'
	const h = display.height + padding + 'px'
	// gsap animation
	// timeline
	const tl = gsap.timeline()
	tl.to(displayContainerWrapper, {
		opacity: 1,
		duration: 0.4,
	})


	tl.to(displayContainer, {
		width: w,
		height: 0,
		duration: 0.3,
		ease: 'circ.inOut',
	}, '>-0.05')

	tl.to(textContainerWrapper, {
		opacity: 1,
		duration: 0.4,
	}, '>-0.3')

	tl.to(displayContainer, {
		height: h,
		duration: 0.3,
		ease: 'circ.inOut',
	}, '>-0.05')

	tl.to(textContainer, {
		width: 'auto',
		height: 0,
		duration: 0.3,
		ease: 'circ.inOut',

		onComplete: () => {
			textContainer.querySelectorAll('[data-text]').forEach((t, i) => {
				textDecodeAnimation(t as HTMLElement, {
					duration: 1,
				})
			})
		}
	}, '>-0.05')

	tl.to(textContainer, {
		height: 'auto',
		duration: 0.3,
		ease: 'circ.inOut',
	}, '>-0.05')


	return () => {
		tl.reverse().then(() => {
			parent.remove()
		})
	}
}

const textDecodeAnimation = (t: HTMLElement, { duration, delay}: {
	duration?: number,
	delay?: number
}) => {
	const arr1 = t.innerHTML.split('')
	const arr2: string[] = []
	duration = duration || arr1.length / 20
	delay = delay || 0
	arr1.forEach((char, i) => arr2[i] = randChar()) //fill arr2 with random characters
	const tl = gsap.timeline()
	let step = 0
	tl.fromTo(t, {
		innerHTML: arr2.join(''),
	}, {
		duration,
		ease: 'power4.in',
		delay: 0.05,
		onUpdate: () => {
			const p = Math.floor(tl.progress() * (arr1.length)) //whole number from 0 - text length
			if (step != p) { //throttle the change of random characters
				step = p
				arr1.forEach((char, i) => arr2[i] = randChar())
				let pt1 = arr1.join('').substring(p, 0),
					pt2 = arr2.join('').substring(arr2.length - p, 0)
				t.innerHTML = pt1 + pt2 //update text
			}
		}
	})
}
// #endregion

// init
// #region
// make a resizing canvas with pixi
const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement
if (!canvas) throw new Error('Canvas not found')

const app = new PIXI.Application<HTMLCanvasElement>({
	width: window.innerWidth,
	height: window.innerHeight,
	resizeTo: window,
	antialias: true,
	hello: true,
	view: canvas,
});

app.stage.name = 'mainStage'


// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);
// #endregion

let isGameLoaded = false
const fontNames = ['Agelast.otf', 'Andromeda.ttf', 'Demora.otf', 'DemoraItalic.otf', 'Drexs.ttf', 'ElderFuthark.ttf', 'Entanglement.ttf', 'Megatrans.otf', 'Phalang.otf', 'Rexusdemo.ttf', 'SpaceallyIllustrationRegular.ttf', 'Trueno.otf', 'MandatoryPlaything.ttf', 'NeoLatina.ttf', 'Inertia.otf', 'Astrobia.ttf', 'Beon.ttf']
const colors = {
	"cyan": 0x93edfd,
	"cyan-400": 0x22d3ee,
	toString: (color: number) => {
		return `#${color.toString(16)}`
	}
}

const init = async () => {
	const loaderBallContainer = new PIXI.Container();
	loaderBallContainer.name = 'loaderBallContainer'


	const GROW_FACTOR = 5
	const ballContainer = new PIXI.Container();

	ballContainer.name = 'ballContainer'
	const particleContainer = new PIXI.ParticleContainer()
	particleContainer.name = 'particleContainer'
	particleContainer.eventMode = 'none'
	particleContainer.position = new PIXI.Point(app.screen.width / 2, app.screen.height / 2)

	ballContainer.eventMode = 'static'



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
	displacementFilter.padding = 200;

	app.stage.filters = [displacementFilter];

	const glowFilter = new GlowFilter({
		color: colors.cyan,
		quality: .05,
		innerStrength: .5,
		alpha: 0.5,
		distance: 60,
		outerStrength: 3,
	})

	// draw a circle using graphics
	const outerGlowLoadingCircle = new Graphics();
	outerGlowLoadingCircle.beginFill('#ffffff', 1, true);
	outerGlowLoadingCircle.drawCircle(0, 0, 50);
	outerGlowLoadingCircle.endFill();

	outerGlowLoadingCircle.x = app.screen.width / 2;
	outerGlowLoadingCircle.y = app.screen.height / 2;

	outerGlowLoadingCircle.eventMode = 'static';
	outerGlowLoadingCircle.cursor = 'pointer';
	outerGlowLoadingCircle.alpha = 0
	outerGlowLoadingCircle.name = 'outerGlowLoadingCircle'

	const innerGlowLoadingCircle = new Graphics();

	innerGlowLoadingCircle.beginFill('#000000', 1, true);
	innerGlowLoadingCircle.drawCircle(0, 0, 50)
	innerGlowLoadingCircle.scale.set(0)
	innerGlowLoadingCircle.alpha = 0.4
	innerGlowLoadingCircle.endFill()
	innerGlowLoadingCircle.eventMode = 'none'
	innerGlowLoadingCircle.name = 'innerGlowLoadingCircle'

	let innerGlowFilter = new GlowFilter({
		color: 0xffffff,
		quality: .05,
		innerStrength: 2,
		alpha: 0.5,
		distance: 30,
		outerStrength: 1.5,
	})

	innerGlowLoadingCircle.filters = [
		innerGlowFilter
	]

	innerGlowLoadingCircle.position = outerGlowLoadingCircle.position;

	const maskSprite = PIXI.Sprite.from('./assets/blur-filter-texture.png')
	maskSprite.name = 'maskSprite'
	maskSprite.anchor.set(0.5)
	maskSprite.position.set(app.screen.width / 2, app.screen.height / 2)
	maskSprite.width = 25
	maskSprite.height = 25
	maskSprite.alpha = 0

	let maskSpriteGrowing = gsap.to(maskSprite, {
		pixi: { width: 600, height: 600 },
		duration: 1.5,
		ease: 'expo.inOut',
		paused: true,
	})

	let maskSpriteAlphaAnimation = gsap.to(maskSprite, {
		pixi: { alpha: 0.7 },
		duration: 0.7,
		ease: 'sine.inOut',
		paused: true,
	})

	let growing = gsap.to([outerGlowLoadingCircle, innerGlowLoadingCircle], {
		pixi: { scale: GROW_FACTOR, alpha: 1 },
		duration: 1.5,
		ease: 'expo.inOut',
		paused: true,
		onUpdate: () => {
			if (isGameLoaded) {
				emitter.emit = false
				outerEmitter.emit = false
			} else
				if (growing.progress() > 0.7) {
					emitter.emit = true
					outerEmitter.emit = true
					maskSpriteAlphaAnimation.play()
				} else {
					emitter.emit = false
					outerEmitter.emit = false
					maskSpriteAlphaAnimation.reverse()
				}
		}
	});

	let maskSpriteExplosion = gsap.to(maskSprite, {
		pixi: { width: app.screen.width + 600, height: app.screen.height + 600, alpha: 1 },
		duration: 1.5,
		ease: 'expo.inOut',
		paused: true,
	})

	let explosion = gsap.to([outerGlowLoadingCircle, innerGlowLoadingCircle], {
		pixi: { scale: 50, alpha: 1 },
		duration: 2,
		ease: 'expo.inOut',
		paused: true,
		onStart: () => {
			emitter.emit = false
			outerEmitter.emit = false
			innerGlowFilter.alpha = 0
			glowFilter.alpha = 0
			isGameLoaded = true

			maskSpriteExplosion.play()
		},
		onUpdate: () => {
			if (explosion.progress() < .3) {
				gsap.to(displacementSprite, { pixi: { scale: .5 }, duration: .5, ease: 'sine.inOut' })
				displacementSprite.angle += 1
				displacementSprite.x += 1
			} else {
				gsap.to(displacementSprite, { pixi: { scale: 5 }, duration: 5, ease: 'sine.inOut' })
			}
		},
		onComplete: () => {
			loadGame()
		}
	})

	outerGlowLoadingCircle.on('mouseenter', () => {
		// use gsap to animate the circle to scale up
		if (!isGameLoaded) {
			growing.play()
			maskSpriteGrowing.play()
		}
	})

	outerGlowLoadingCircle.on('mouseleave', () => {
		// use gsap to animate the circle to scale down
		if (!isGameLoaded) {
			growing.reverse()
			maskSpriteGrowing.reverse()
		}
	})


	outerGlowLoadingCircle.on('mousedown', () => {
		// explode the circle
		explosion.play()
		ballContainer.cursor = 'default'
		ballContainer.eventMode = 'none'
	})

	// make the circle glow outwards
	ballContainer.filters = [
		glowFilter
	];


	ballContainer.addChild(outerGlowLoadingCircle);
	ballContainer.addChild(innerGlowLoadingCircle);

	gsap.to(
		outerGlowLoadingCircle,
		{
			pixi: { alpha: 1 },
			duration: 1,
			ease: 'expo.inOut',
			delay: 1,
		}
	)

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

	loaderBallContainer.addChild(ballContainer);
	loaderBallContainer.addChild(particleContainer);
	loaderBallContainer.addChild(displacementSprite);

	// game
	const gameContainer = new PIXI.Container();
	gameContainer.name = 'gameContainer'

	const starContainer = new PIXI.Container();
	starContainer.interactiveChildren = false
	starContainer.eventMode = 'none'

	starContainer.width = app.screen.width
	starContainer.height = app.screen.height
	starContainer.name = 'starContainer'

	// add a background
	const bgContainer = new PIXI.Container();
	bgContainer.name = 'bgContainer'

	// use an image for the background
	const bg = await PIXI.Assets.load('./assets/bg.jpg');
	const bgSprite = new PIXI.Sprite(PIXI.Texture.from(bg.baseTexture));
	// aspect ratio
	const aspect = bgSprite.texture.baseTexture.width / bgSprite.texture.baseTexture.height //1.5

	if (app.screen.width > app.screen.height) {
		bgSprite.width = app.screen.height * aspect
		bgSprite.height = app.screen.height
	} else {
		bgSprite.width = app.screen.width
		bgSprite.height = app.screen.width / aspect
	}
	// center the bg
	bgSprite.anchor.set(0.5);
	bgSprite.position.set(app.screen.width / 2, app.screen.height / 2)

	bgContainer.addChild(bgSprite)

	// stars
	const starColors = [
		// 0xffffff,
		colors.cyan,
		// 0x7E4CCB,
		// 0xF37A18,
		0x04FCFC,
	]

	// density of stars should be based on screen size, 15 per 100000px
	const STAR_COUNT = Math.floor((app.screen.width * app.screen.height)) * 20 / 100000
	console.log(STAR_COUNT)

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

	// bg objects
	const bgObjectsContainer = new PIXI.Container()
	bgObjectsContainer.name = 'bgObjects'
	bgObjectsContainer.position.set(app.screen.width / 2, app.screen.height / 2)

	// add a circle to bgObjects
	const bgCircle = new Graphics()
	bgCircle.beginFill(0xff33ef, 1, true)
	bgCircle.drawCircle(250, 600, 100)
	bgCircle.endFill()
	bgCircle.position.set(0, 0)
	bgObjectsContainer.addChild(bgCircle)

	// player
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


	gameContainer.addChild(bgContainer)
	gameContainer.addChild(starContainer)
	gameContainer.addChild(bgObjectsContainer)
	gameContainer.addChild(playerContainer)


	gameContainer.alpha = 1

	app.stage.addChild(loaderBallContainer)
	app.stage.addChild(gameContainer)


	gameContainer.addChild(maskSprite)

	gameContainer.mask = maskSprite

	const loadGame = () => {
		outerGlowLoadingCircle.destroy()
		innerGlowLoadingCircle.destroy()

		const cleanup = spawnTexts(playerContainer, [
			`<div class="grid grid-cols-[1fr_1fr] gap-x-4 gap-y-6 items-center text-white text-lg">
				<p class="corner-border-small text-cyan-400 font-header font-bold flex items-center justify-center !p-[2px_6px]">W</p>
				<p data-text="true" class="font-body">Accelerate</p>
				<p class="corner-border-small text-cyan-400 font-header font-bold flex items-center justify-center !p-[2px_6px]">S</p>
				<p data-text="true" class="font-body">Decelerate</p>
				<p class="corner-border-small text-cyan-400 font-header font-bold flex items-center justify-center !p-[2px_6px]">A</p>
				<p data-text="true" class="font-body">Rotate Left</p>
				<p class="corner-border-small text-cyan-400 font-header font-bold flex items-center justify-center !p-[2px_6px]">D</p>
				<p data-text="true" class="font-body">Rotate Right</p>
			</div>
			`]
		)

		let x: NodeJS.Timeout | undefined

		let y = () => {
			if (w.isDown) {
				if (!x)
					x = setTimeout(() => {
						cleanup()
						app.ticker.remove(y)
					}, 3000)
			}
		}

		app.ticker.add(y)
	}

	// player movement
	// #region
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
	// #endregion

	// displacement filter animation
	// #region
	app.ticker.add((delta) => {
		displacementSprite.x += 0.2 * delta;
		displacementSprite.angle += 0.5 * delta;

		// Reset x to 0 when it's over width to keep values from going to very huge numbers.
		if (displacementSprite.x > app.screen.width) {
			displacementSprite.x = 0;
		}
	});
	// #endregion
}

init()

// @ts-ignore
globalThis.__PIXI_APP__ = app;
