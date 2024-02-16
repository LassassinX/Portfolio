import './style.css';
import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter'
import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import { GlowFilter } from '@pixi/filter-glow';
import { MotionBlurFilter } from '@pixi/filter-motion-blur';
import anime from 'animejs/lib/anime.es.js';
import '@pixi/gif';



import { gsap, wrap } from 'gsap';
import { RoughEase } from "gsap/EasePack";


gsap.registerPlugin(RoughEase);
import { PixiPlugin } from 'gsap/PixiPlugin';


// particles
import particleConfig from './emitter.json'
import outerParticleConfig from './emitter-outer.json'
import playerThrustEmitterConfig from './thrust-emitter.json'
import projectorEmitterConfig from './projector-emitter.json'

gsap.registerPlugin(PixiPlugin);
// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);

// texts
const TEXTS = {
	aboutMe: `CoDEX Entry - Earth[340] - Date 14/12/2350

I am not sure who will find this. This is my digital diary. A record of my thoughts and experiences.

As a wanderer of the digital world I navigate as a Full Stack Developer aspiring to manifest my imagination and creativity. My ambition for creating visuals beyond this realm knows no bounds. Despite wielding a formidable arsenal of cutting-edge technologies like [NextJS], [ReactJS], [PixiJS], [Java SpringBoot] and more, I remain on a quest to transcend my own limitiations, aspiring to be the pixel wizard that I dream of... Trying my best to capture the beauty of the stars.

I boarded the spaceship Earth[340] on 12/12/2350. I was on a mission to the Andro${Array.from({ length: 5 }, randChar).join('')} ${Array.from({ length: 8 }, randChar).join('')} ${Array.from({ length: 5 }, randChar).join('')} ${Array.from({ length: 8 }, randChar).join('')}.....>>><<>>>>

...DROPPED CONNECTION...`,
}

// functions
// #region
const rad = (degrees: number) => degrees * Math.PI / 180
const randomFromRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomFromArray = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const checkCollision = (a: PIXI.Container, b: PIXI.Container, padding: number, point = false) => {
	const aBounds = a.getBounds()
	const bBounds = b.getBounds()
	if (point) {
		// return from a midpoint only
		const aMid = a.getGlobalPosition()
		return aMid.x > bBounds.x - padding &&
			aMid.x < bBounds.x + bBounds.width + padding &&
			aMid.y > bBounds.y - padding &&
			aMid.y < bBounds.y + bBounds.height + padding
	}
	return aBounds.x + aBounds.width + padding > bBounds.x &&
		aBounds.x < bBounds.x + bBounds.width + padding &&
		aBounds.y + aBounds.height + padding > bBounds.y &&
		aBounds.y < bBounds.y + bBounds.height + padding
}

const getDistance = (a: PIXI.Container, b: PIXI.Container) => {
	const dx = a.getGlobalPosition().x - b.getGlobalPosition().x
	const dy = a.getGlobalPosition().y - b.getGlobalPosition().y
	return Math.sqrt(dx * dx + dy * dy)
}

const makeRect = ({
	width,
	height,
	color,
	alpha,
	cornerSize = 10,
	cornerThickness = 2,
	borderThickness = 0,
	borderColor = 0x000000,
}: {
	width: number,
	height: number,
	alpha: number,
	color?: number,
	cornerSize?: number,
	cornerThickness?: number,
	borderThickness?: number,
	borderColor?: number,
}) => {
	// add a background
	const bg = new PIXI.Graphics()
	if (alpha) {
		bg.beginFill(color, alpha)
		bg.drawRect(0, 0, width, height)
		bg.endFill()
	}

	if (borderThickness) {
		bg.lineStyle(borderThickness, borderColor, 1)
		bg.drawRect(0, 0, width, height)

		return bg
	}

	// add 4 corners to the bg
	const corners = [
		{ x: 0, y: 0 },
		{ x: width, y: 0 },
		{ x: 0, y: height },
		{ x: width, y: height },
	]

	corners.forEach((corner, i) => {
		const cornerG = new PIXI.Graphics()
		// lines
		cornerG.lineStyle(cornerThickness, colors.cyanBright, 1)

		// draw a corner, check
		if (i === 0) {
			cornerG.moveTo(corner.x, corner.y + cornerSize)
			cornerG.lineTo(corner.x, corner.y)
			cornerG.lineTo(corner.x + cornerSize, corner.y)
		}
		if (i === 1) {
			cornerG.moveTo(corner.x, corner.y + cornerSize)
			cornerG.lineTo(corner.x, corner.y)
			cornerG.lineTo(corner.x - cornerSize, corner.y)
		}
		if (i === 2) {
			cornerG.moveTo(corner.x, corner.y - cornerSize)
			cornerG.lineTo(corner.x, corner.y)
			cornerG.lineTo(corner.x + cornerSize, corner.y)
		}
		if (i === 3) {
			cornerG.moveTo(corner.x, corner.y - cornerSize)
			cornerG.lineTo(corner.x, corner.y)
			cornerG.lineTo(corner.x - cornerSize, corner.y)
		}

		bg.addChild(cornerG)
	})

	return bg
}

// lets make a single star
const createStar = (x: number, y: number, size: number, color: number) => {

	const star = PIXI.Sprite.from(Math.random() < 0.3 ? './assets/star.png' : './assets/starSparkle.png')
	star.width = size
	star.height = size
	star.tint = color
	star.anchor.set(0.5)
	star.position.set(x, y)
	star.rotation = Math.random() * Math.PI * 2
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

const spawnTexts = (display: PIXI.Container, texts: string[], select: boolean = true) => {
	const parent = document.createElement('div')
	parent.classList.add('select-parent')

	const padding = 20
	const { wrapper: displayContainerWrapper, container: displayContainer } = _selectContainer(display)
	const { wrapper: textContainerWrapper, container: textContainer } = _selectTextContainer(display, texts)

	const offsetX = 25 + display.width
	const offsetY = 0

	textContainerWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`

	if (select)
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
	if (select) {
		tl.to(displayContainerWrapper, {
			opacity: 1,
			duration: 0.4,
		})


		tl.to(displayContainer, {
			width: w,
			height: 0,
			duration: 0.3,
			ease: 'circ.inOut',
		})
	}

	tl.to(textContainerWrapper, {
		opacity: 1,
		duration: 0.2,
	})

	if (select)
		tl.to(displayContainer, {
			height: h,
			duration: 0.3,
			ease: 'circ.inOut',
		})

	tl.to(textContainer, {
		width: 'auto',
		height: 0,
		duration: 0.15,
		ease: 'circ.inOut',

		onComplete: () => {
			textContainer.querySelectorAll('[data-text]').forEach((t, i) => {
				textDecodeAnimationHTML(t as HTMLElement, {
					duration: 1,
				})
			})
		}
	})

	tl.to(textContainer, {
		height: 'auto',
		duration: 0.3,
		ease: 'circ.inOut',
	})


	return () => {
		tl.reverse().then(() => {
			textContainerWrapper.style.opacity = '0'
			displayContainerWrapper.style.opacity = '0'

			parent.remove()
		})
	}
}

const textDecodeAnimationHTML = (t: HTMLElement, { duration, delay }: {
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

const textDecodeAnimationPixijs = (t: PIXI.Text, { duration, delay, updateDelay, finalTint }: {
	duration?: number,
	delay?: number,
	updateDelay?: number,
	finalTint?: number
}) => {
	const targetText = t.text;
	const targetTextArr = targetText.split('\n'); // Split the text based on newline characters
	const jarbledTextArr = targetTextArr.map(line => {
		const words = line.split(' ');
		const jarbledWords = words.map(word => word.split('').map(randChar).join(''));
		return jarbledWords.join(' ');
	});

	let jarbledText = jarbledTextArr.join('\n'); // Join the lines back together with newline characters

	// lets jarble the text
	t.text = jarbledText

	// get current time
	let start = Date.now()
	const anim = gsap.to(t, {
		pixi: {
			tint: finalTint ? finalTint : 0xFFFFFF
		},
		duration,
		delay,
		paused: true,
		onUpdate: () => {
			if (Date.now() - start > (updateDelay || 0)) {
				// debounce the change of random characters
				const p = anim.progress() * targetText.length
				t.text = targetText.substring(0, p) + jarbledText.substring(p)
				jarbledText = jarbledTextArr.map(line => {
					const words = line.split(' ');
					const jarbledWords = words.map(word => word.split('').map(randChar).join(''));
					return jarbledWords.join(' ');
				}).join('\n');

				// reset the start time
				start = Date.now()

				// tint the text
			}
		},

		onComplete: () => {
			t.text = targetText
		}
	})

	return anim
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
const fontNames = ['Agelast.otf', 'Andromeda.ttf', 'Demora.otf', 'DemoraItalic.otf', 'Drexs.ttf', 'ElderFuthark.ttf', 'Entanglement.ttf', 'Megatrans.otf', 'Phalang.otf', 'Rexusdemo.ttf', 'SpaceallyIllustrationRegular.ttf', 'Trueno.otf', 'MandatoryPlaything.ttf', 'NeoLatina.ttf', 'Inertia.otf', 'Astrobia.ttf', 'Beon.ttf', 'CPMono_Black.otf', 'CPMono_Bold.otf', 'CPMono_Light.otf', 'CPMono_ExtraLight.otf', 'CPMono_Plain.otf']
const colors = {
	cyan: 0x93edfd,
	cyanBright: 0x22d3ee,
	// greenCyan: 0x7fffd4,
	green: 0x00ff5e,
	orangeRed: 0xff4500,
	orange: 0xff9736,
	orangeBright: 0xFFA500,
	toString: (color: number) => {
		return `#${color.toString(16)}`
	}
}

const headerFont = 'MandatoryPlaything'
const bodyFont = 'CPMono_Light'

const init = async () => {
	await PIXI.Assets.load(fontNames.map(font => `./assets/${font}`))

	// game
	const gameContainer = new PIXI.Container();
	gameContainer.name = 'gameContainer'

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
		pixi: { width: 480, height: 480 },
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
		duration: 2.5,
		ease: 'expo.inOut',
		paused: true,
	})

	let gameContainerExplosion = gsap.to(gameContainer, {
		pixi: { scale: 1, positionX: 0, positionY: 0 },
		duration: 2.5,
		ease: 'expo.inOut',
		paused: true,
		// onUpdate: () => {
		// 	// fix the pivot point by bringing both the x and y to 0 depending on the current scale
		// 	gameContainer.pivot.set(
		// 		-app.screen.width / 2 + ((gameContainer.scale.x - 0.5) / 0.5 * app.screen.width / 2),
		// 		-app.screen.height / 2 + ((gameContainer.scale.y - 0.5) / 0.5 * app.screen.height / 2)
		// 	)
		// }
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
			outerGlowLoadingCircle.eventMode = 'none'

			maskSpriteExplosion.play()
			gameContainerExplosion.play()
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
	const bg = await PIXI.Assets.load('./assets/bgNew.jpg');
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
		// bright orange
		// 0xe87502,
		// 0x02e82c,
		// 0xe802be,
		// 0xff1414,
		// 0xfc9351,


		// colors.cyanBright,
		// 0x7E4CCB,
		// 0xF37A18,
		// 0x04FCFC,
	]

	// density of stars should be based on screen size, 15 per 100000px
	const STAR_COUNT = Math.floor((app.screen.width * app.screen.height)) * 20 / 100000
	console.log(STAR_COUNT)

	for (let i = 0; i < STAR_COUNT; i++) {
		const minSize = 4
		const maxSize = 20
		const color = randomFromArray(starColors), x = randomFromRange(0, app.view.width), y = randomFromRange(0, app.view.height),
			size = Math.floor(randomFromRange(minSize, maxSize))
		const starSprite = createStar(x, y, size, color)

		starSprite.alpha = randomFromRange(0.1, 0.3)
		starSprite.anchor.set(0.5);
		starSprite.x = x;
		starSprite.y = y;
		starSprite.zIndex = size;

		const finalAlpha = 1 * starSprite.zIndex / (maxSize - 1)
		gsap.to(starSprite, {
			pixi: { alpha: finalAlpha },
			duration: randomFromRange(1, 2.5),
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
		const rotate = starSprite.rotation

		gsap.to(starSprite, {
			pixi: {
				rotation: rotate - Math.PI * 2 //full rotation 
			},
			duration: randomFromRange(10, 25),
			ease: `sine.inOut`,
			repeat: -1,
		})

		starSprite.cullable = true
		starContainer.addChild(starSprite);
	}

	// bg objects
	const bgObjectsContainer = new PIXI.Container()
	bgObjectsContainer.name = 'bgObjects'
	bgObjectsContainer.position.set(app.screen.width / 2, app.screen.height / 2)

	// player
	const w = new Keyboard('w')
	const a = new Keyboard('a')
	const s = new Keyboard('s')
	const d = new Keyboard('d')

	const player = PIXI.Sprite.from('./assets/PlayerCraft.png')
	player.anchor.set(0.5)
	player.name = 'player'
	player.roundPixels = true
	player.scale.set(0.5)

	const playerContainer = new PIXI.Container() as PIXI.Container & {
		velX: number,
		velY: number,
		setVelX: (vel: number) => void,
		setVelY: (vel: number) => void,
		getSpeed: () => number,
	}

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

	const thrustGap = 13
	const thrustAngle = 10
	const playerThrustContainer1 = new PIXI.Container()
	playerThrustContainer1.eventMode = 'none'
	playerThrustContainer1.angle = -thrustAngle

	const playerThrustParticles1 = new particles.Emitter(
		playerThrustContainer1,
		particles.upgradeConfig(
			playerThrustEmitterConfig,
			[PIXI.Texture.from('./assets/particle.png'), PIXI.Texture.from('./assets/fire.png')]
		)
	)

	playerThrustParticles1.autoUpdate = true
	playerThrustParticles1.emit = true

	playerThrustContainer1.position.set(thrustGap, 0)

	const playerThrustContainer2 = new PIXI.Container()
	playerThrustContainer2.eventMode = 'none'
	playerThrustContainer2.angle = thrustAngle

	const playerThrustParticles2 = new particles.Emitter(
		playerThrustContainer2,
		particles.upgradeConfig(
			playerThrustEmitterConfig,
			[PIXI.Texture.from('./assets/particle.png'), PIXI.Texture.from('./assets/fire.png')]
		)
	)

	playerThrustParticles2.autoUpdate = true
	playerThrustParticles2.emit = true

	playerThrustContainer2.position.set(-thrustGap, 0)

	const playerThrustContainer = new PIXI.Container()
	playerThrustContainer.name = 'playerThrustContainer'

	playerThrustContainer.addChild(playerThrustContainer1)
	playerThrustContainer.addChild(playerThrustContainer2)
	playerThrustContainer.scale.set(0.5)
	playerThrustContainer.position.set(0, 4)

	playerContainer.addChild(playerThrustContainer)
	playerContainer.addChild(player)

	gameContainer.addChild(bgContainer)
	gameContainer.addChild(starContainer)
	gameContainer.addChild(bgObjectsContainer)
	gameContainer.addChild(playerContainer)


	gameContainer.alpha = 1

	app.stage.addChild(loaderBallContainer)
	app.stage.addChild(gameContainer)
	app.stage.addChild(maskSprite)

	gameContainer.mask = maskSprite
	let playerTutorialCleanupFunction: () => void

	let uiTexts: any[] = []
	const spawnUIText = (targetContainer: PIXI.Container, range: number, text: string, openConditional: Function | undefined, onButtonPress: Function | undefined) => {
		let x: (() => void) | undefined
		let isInRange = false
		const playerAction = () => {
			isInRange = checkCollision(player, targetContainer, range, true)
			if (openConditional) {
				isInRange = isInRange && openConditional()
			}

			if (isInRange) {
				if (playerTutorialCleanupFunction)
					playerTutorialCleanupFunction()

				if (!x) {
					uiTexts.forEach((x) => {
						if (x) x()
					})

					x = spawnTexts(player, [`
					<div class="flex items-center gap-2 text-white font-body text-lg">press <span class="text-cyan-400 corner-border-small font-bold font-header !p-[1px_7px]">F</span> ${text}</div>
				`], false)
				}

				uiTexts.push(x)
			} else {
				if (x) {
					x()
					uiTexts = uiTexts.filter((t) => t !== x)
					x = undefined
				}
			}
		}

		app.ticker.add(playerAction)

		window.addEventListener('keydown', (e) => {
			if (e.key.toLocaleLowerCase() === 'f' && isInRange && onButtonPress) {
				onButtonPress()
			}
		})
	}
	// sections
	const sections: PIXI.Container[] = []
	// about me section
	// #region
	{
		const aboutMeContainer = new PIXI.Container()
		aboutMeContainer.name = 'aboutMeContainer'

		const padding = 40
		const aboutMeTitleText = new PIXI.Text(
			'About Me', {
			fontFamily: headerFont,
			fontSize: 32,
			align: 'left',
			fill: colors.cyanBright,
			wordWrap: true,
			wordWrapWidth: 700,
		})

		const aboutMeBodyText = new PIXI.Text(
			TEXTS.aboutMe, {
			fontFamily: bodyFont,
			fontSize: 20,
			align: 'left',
			fill: 0xffffff,
			padding: 20,
			wordWrap: true,
			wordWrapWidth: 750,
		})

		aboutMeBodyText.position.set(padding / 2, padding / 2)

		const bodyBg = makeRect({
			width: aboutMeBodyText.width + padding,
			height: aboutMeBodyText.height + padding,
			color: 0x000000,
			alpha: 0.5,
			cornerSize: 15,
			cornerThickness: 3,
		})

		const bodyBgMask = makeRect({
			width: aboutMeBodyText.width,
			height: aboutMeBodyText.height,
			color: 0xffffff,
			alpha: 1,
		})

		bodyBgMask.position.set(padding / 2, padding / 2)

		aboutMeBodyText.mask = bodyBgMask

		const titleBg = makeRect({
			width: aboutMeBodyText.width + padding,
			height: 140 + padding,
			color: 0x000000,
			alpha: 0.5,
			cornerSize: 15,
			cornerThickness: 3,
		})

		// make a picture square of 140
		const pictureSquare = makeRect({
			width: 140,
			height: 140,
			alpha: 0,
			borderThickness: 2,
			borderColor: colors.cyanBright,
		})


		pictureSquare.position.set(padding / 2, padding / 2)

		// load the question mark
		const questionMark = PIXI.Sprite.from('./assets/question.png')
		questionMark.width = 100
		questionMark.height = 100
		pictureSquare.addChild(questionMark)
		questionMark.position.set(padding / 2, padding / 2)

		const line = new Graphics().lineStyle(2, colors.cyanBright, 1).moveTo(0, 0).lineTo(0, titleBg.height)
		line.position.set(pictureSquare.x + pictureSquare.width + padding / 2, 0)

		const headerContainer = new PIXI.Container()
		headerContainer.name = 'headerContainer'

		sections.push(headerContainer)

		aboutMeTitleText.position.set(line.x + line.width + padding / 2, padding / 2)

		// socials 
		const socials = [
			{ name: 'Github', link: `https://github.com/LassassinX` },
			{ name: 'Linkedin', link: `https://www.linkedin.com/in/sanjid-chowdhury-509a57177/` },
			{ name: 'Facebook', link: `https://www.facebook.com/LassassinX/` },
			{ name: 'Resume/CV', link: `` },
		]

		const socialsContainer = new PIXI.Container()
		socialsContainer.name = 'socialsContainer'

		let prevSocial: PIXI.Container | undefined
		let socialAnimations: gsap.core.Tween[] = []
		socials.forEach((social, i) => {
			let padding = 20
			let gap = 20
			const socialContainer = new PIXI.Container()
			const text = new PIXI.Text(
				social.name, {
				fontFamily: bodyFont,
				fontSize: 18,
				align: 'left',
				fill: 0xffffff,
			})

			const bg = makeRect({
				width: text.width + padding,
				height: text.height + padding,
				alpha: 0,
				cornerSize: 25,
				cornerThickness: 1,
			})

			const bg2 = makeRect({
				width: text.width + padding,
				height: text.height + padding,
				alpha: 0,
				borderThickness: 1,
				borderColor: colors.cyanBright,
			})

			bg2.alpha = 0
			const bgMask = makeRect({
				width: text.width,
				height: text.height,
				color: 0xffffff,
				alpha: 1,
			})

			text.position.set(padding / 2, padding / 2)
			bgMask.position.set(padding / 2, padding / 2)

			text.mask = bgMask
			bg.position.set(0, 0)

			socialContainer.addChild(bg)
			socialContainer.addChild(bg2)
			socialContainer.addChild(bgMask)
			socialContainer.addChild(text)
			socialContainer.position.set(prevSocial ? prevSocial.x + prevSocial.width + gap : 0, 0)
			prevSocial = socialContainer

			socialAnimations.push(textDecodeAnimationPixijs(text, { duration: 1, updateDelay: 1, finalTint: colors.cyanBright }))
			socialContainer.eventMode = 'static'

			spawnUIText(socialContainer, 0, `to view ${social.name}`, () => {
				return isDecoded
			}, () => {
				window.open(social.link, '_blank')
			})

			socialContainer.on('mouseenter', () => {
				if (isDecoded && socialAnimations[i].progress() === 1) {
					socialContainer.cursor = 'pointer'
				}

				if (socialAnimations[i].progress() === 1)
					gsap.to(bg2, { pixi: { alpha: 1 }, duration: 0.2, ease: 'sine.inOut' })
			})
			socialContainer.on('mouseleave', () => {
				if (socialAnimations[i].progress() === 1)
					gsap.to(bg2, { pixi: { alpha: 0 }, duration: 0.2, ease: 'sine.inOut' })
			})

			socialContainer.on('mousedown', () => {
				if (isDecoded && socialAnimations[i].progress() === 1) {
					window.open(social.link, '_blank')
				}
			})
			socialsContainer.addChild(socialContainer)
		})

		socialsContainer.position.set(aboutMeTitleText.x, titleBg.height - socialsContainer.height - padding / 2)
		headerContainer.addChild(titleBg)
		headerContainer.addChild(line)
		headerContainer.addChild(pictureSquare)
		headerContainer.addChild(aboutMeTitleText)
		headerContainer.addChild(socialsContainer)

		const bodyContainer = new PIXI.Container()
		bodyContainer.addChild(bodyBg)
		bodyContainer.addChild(bodyBgMask)
		bodyContainer.addChild(aboutMeBodyText)
		bodyContainer.position.set(0, titleBg.height + padding / 2)

		aboutMeContainer.addChild(headerContainer)
		aboutMeContainer.addChild(bodyContainer)

		aboutMeContainer.position.set(-2000, -300)
		bgObjectsContainer.addChild(aboutMeContainer)

		// check if player is near the about me section
		let isInRange = false
		let isDecoded = false
		{
			let x: (() => void) | undefined
			const playerDecoder = () => {
				isInRange = checkCollision(player, aboutMeContainer, 150)
				if (isDecoded) {
					if (x) {
						x()
						x = undefined
					}
					app.ticker.remove(playerDecoder)
					return
				}
				if (isInRange) {
					if (playerTutorialCleanupFunction)
						playerTutorialCleanupFunction()

					if (!x)
						x = spawnTexts(player, [`
						<div class="flex items-center gap-2 text-white font-body text-lg">press <span class="text-cyan-400 corner-border-small font-bold font-header !p-[1px_7px]">F</span> to decode_</div>
					`], false)
				} else {
					if (x) {
						x()
						x = undefined
					}
				}
			}

			app.ticker.add(playerDecoder)
		}

		// animate the about me section
		const decodeBodyText = textDecodeAnimationPixijs(aboutMeBodyText, { duration: 5, updateDelay: 40, finalTint: colors.green })
		const decodeAboutMe = (e: KeyboardEvent) => {
			if (e.key.toLocaleLowerCase() === 'f' && isInRange) {
				isDecoded = true
				window.removeEventListener('keydown', decodeAboutMe)
				decodeBodyText.play()
				socialAnimations.forEach(anim => anim.play())
				// transition the question mark to a picture
				gsap.to(questionMark, {
					pixi: { alpha: 0 },
					duration: 1,
					ease: 'sine.inOut',
					onComplete: () => {
						questionMark.width = 140
						questionMark.height = 140
						questionMark.position.set(0, 0)
						questionMark.texture = PIXI.Texture.from('./assets/avatar.png')
						gsap.to(questionMark, {
							pixi: { alpha: 1 },
							duration: 1,
							ease: 'sine.inOut',
						})
					}
				});

				// transition marker
				(markers[0] as PIXI.Sprite).texture = PIXI.Texture.from('./assets/markerGreen.png')

			}
		}
		window.addEventListener('keydown', decodeAboutMe)
	}
	// #endregion

	// Project section
	// #region
	{
		const projectsContainer = new PIXI.Container()
		projectsContainer.name = 'projectsContainer'

		// load the projectsBg
		const projectsVisorContainer = new PIXI.Container()
		projectsVisorContainer.name = 'projectsVisorContainer'

		const projectsVisor = PIXI.Sprite.from('./assets/projectsVisor2.png')
		projectsVisor.width = 660
		projectsVisor.height = 221

		sections.push(projectsVisor)

		const projectTextContainer = new PIXI.Container()

		const projectsText = new PIXI.Text(
			'Pro', {
			fontFamily: headerFont,
			fontSize: 91,
			align: 'left',
			fill: colors.cyanBright,
		})

		const projectsText2 = new PIXI.Text(
			'jects', {
			fontFamily: headerFont,
			fontSize: 91,
			align: 'left',
			fill: colors.cyanBright,
		})

		projectsText2.position.set(projectsText.width, 0)

		projectTextContainer.addChild(projectsText)
		projectTextContainer.addChild(projectsText2)
		projectTextContainer.position.set(70, 50)

		projectsText2.alpha = 0.2
		let blinkGap = 0.04
		const tl = gsap.timeline({
			repeat: -1,
		})
		const microBlink = (element: any, tl: GSAPTimeline) => {
			tl.to(element, {
				pixi: {
					alpha: 1,
				},
				duration: blinkGap,
				ease: 'steps(1)',
			})
			tl.to(element, {
				pixi: {
					alpha: 0.2,
				},
				duration: blinkGap,
				ease: 'steps(1)',
			})
			tl.to(element, {
				pixi: {
					alpha: 1,
				},
				duration: blinkGap,
				ease: 'steps(1)',
			})
		}
		const blink = (element: any, tl: GSAPTimeline) => {
			microBlink(element, tl)
			microBlink(element, tl)
		}
		blink(projectsText2, tl)
		tl.to(projectsText2, {
			pixi: {
				alpha: 1,
			},
			duration: 3,
			ease: 'steps(1)',
		})
		tl.to(projectsText2, {
			pixi: {
				alpha: 0.2,
			},
			duration: 2,
			ease: 'steps(1)',
		})
		blink(projectsText2, tl)
		tl.to(projectsText2, {
			pixi: {
				alpha: 1,
			},
			duration: 3,
			ease: 'steps(1)',
		})
		microBlink(projectsText2, tl)
		microBlink(projectsText2, tl)
		tl.to(projectsText2, {
			pixi: {
				alpha: 0.2,
			},
			duration: 3,
			ease: 'steps(1)',
		})
		microBlink(projectsText2, tl)

		projectsVisorContainer.addChild(projectsVisor)
		projectsVisorContainer.addChild(projectTextContainer)

		const projectorLightContainer = new PIXI.Container()
		projectorLightContainer.name = 'projectorLightContainer'

		const light = new PIXI.Sprite(PIXI.Texture.from('./assets/projectorLight2.png'))
		light.width = 320
		light.height = 360
		light.tint = colors.cyanBright


		const lightParticlesContainer = new PIXI.Container
		lightParticlesContainer.eventMode = 'none'

		// spawn particles
		const lightParticles = new particles.Emitter(
			lightParticlesContainer,
			particles.upgradeConfig(
				projectorEmitterConfig,
				[PIXI.Texture.from('./assets/starWhite.png'), PIXI.Texture.from('./assets/starWhiteSparkle.png')]
			)
		)

		lightParticles.autoUpdate = true
		lightParticles.emit = false

		lightParticlesContainer.position.set(77, 153)

		projectorLightContainer.addChild(lightParticlesContainer)
		projectorLightContainer.addChild(light)
		projectorLightContainer.position.set(projectsVisor.width - 60, -120)
		projectorLightContainer.alpha = 0

		const projectElementsContainer = new PIXI.Container()
		projectsContainer.name = 'projectsElementContainer'

		const projects = [
			{
				name: 'GunZ',
				description: `Fight off hordes of enemies /̵͇̿̿/'̿'̿ ̿ ̿̿ ̿̿ ̿̿  in this visually appealing fast paced action game for the web.`,
				skills: ['HTMLCanvas', 'TailwindCSS', 'NextJS', 'AnimeJS', 'Vercel'],
				link: 'https://gunz.vercel.app/',
				video: './assets/GunZ.gif',
			},
			{
				name: 'EzNotes',
				description: 'A super convinient note taking app 📝 with cloud storage and SSO. Practically sublime text for the web.',
				skills: ['NextJS', 'TS', 'TailwindCSS', 'Vercel', 'Prisma', 'NextAuth'],
				link: 'https://ez-note.vercel.app/',
				image: './assets/ez-notes.png',
			},
			{
				name: 'Strange occurances',
				description: 'UNDER DEVELOPMENT. A live chat app to connect with random strangers with common interests.',
				skills: ['NextJS', 'TS', 'TailwindCSS', 'Java', 'SpringBoot', 'Heroku'],
			},
			{
				name: 'Portfolio',
				description: 'This beloved portfolio website ♡, and its simplier version.',
				skills: ['NextJS', 'TS', 'TailwindCSS', 'PixiJS', 'GSAP', 'Photoshop'],
			},
		]

		let y = 0, gap = 30, contentGap = 20, x = 0, bgPadding = 120, bgTopMargin = 24, bgLeftMargin = 39, bgRightMargin = 65
		projects.forEach((project, i) => {
			const projectElementContainer = new PIXI.Container()
			projectElementContainer.name = `projectContainer${i}`

			const projectContentContainer = new PIXI.Container()
			projectContentContainer.name = 'projectContentContainer'

			const projectBg = PIXI.Sprite.from('./assets/projectContainer2.png')
			const aspect = 450 / 390
			projectBg.width = 600
			projectBg.height = projectBg.width / aspect

			const projectHeader = new PIXI.Text(
				project.name, {
				fontFamily: headerFont,
				fontSize: 48,
				align: 'left',
				fill: colors.cyanBright,
				wordWrap: true,
				wordWrapWidth: projectBg.width - bgPadding + 50,
			})

			const projectDescription = new PIXI.Text(
				project.description, {
				fontFamily: bodyFont,
				fontSize: 20,
				align: 'left',
				fill: 0xffffff,
				wordWrap: true,
				wordWrapWidth: projectBg.width - bgPadding + 50,
			})

			projectDescription.position.set(0, projectHeader.height + contentGap * 1.5)

			// skills
			const skillsContainer = new PIXI.Container()
			{
				let skillsPadding = 10
				let skillsGap = 10, prevSkill: PIXI.Container
				skillsContainer.name = 'skillsContainer'
				project.skills.forEach((skill, i) => {
					const skillContainer = new PIXI.Container()
					const text = new PIXI.Text(
						skill, {
						fontFamily: bodyFont,
						fontSize: 14,
						align: 'left',
						fill: colors.green,
					})

					const bg = makeRect({
						width: text.width + skillsPadding,
						height: text.height + skillsPadding,
						alpha: 0,
						borderColor: colors.green,
						borderThickness: 1,
					})

					text.position.set(skillsPadding / 2, skillsPadding / 2)
					bg.position.set(0, 0)

					skillContainer.addChild(bg)
					skillContainer.addChild(text)
					skillContainer.position.set(prevSkill ? prevSkill.x + prevSkill.width + skillsGap : 0, 0)
					prevSkill = skillContainer

					skillsContainer.addChild(skillContainer)
				})

				skillsContainer.pivot.set(skillsContainer.width / 2, 0)
				skillsContainer.position.set(projectDescription.width / 2, projectBg.height / 2 - skillsContainer.height - 35)
			}

			// gif
			if (project.video) {
				PIXI.Assets.load(project.video).then((gif) => {
					gif.height = 192
					gif.width = 493
					gif.position.set(-10, projectBg.height - gif.height - 65)
					projectContentContainer.addChild(gif)
				});
			}

			if (project.image) {
				const image = PIXI.Sprite.from(project.image)
				image.height = 192
				image.width = 493
				image.position.set(-10, projectBg.height - image.height - 65)
				projectContentContainer.addChild(image)
			}

			if (!project.image && !project.video) {
				const text = new PIXI.Text(
					'No sample available', {
					fontFamily: headerFont,
					fontSize: 30,
					fontWeight: 'bold',
					align: 'left',
					fill: 0xff1111,
				})
				text.anchor.set(0.5)
				text.alpha = 0.75
				text.position.set(projectDescription.width / 2, projectBg.height * 2 / 3)
				projectContentContainer.addChild(text)
			}

			if (project.link) {
				spawnUIText(projectContentContainer, 0, `to view ${project.name}`, () => {
					return projectElementsContainer.alpha === 1
				}, () => {
					window.open(project.link, '_blank')
				})
			}

			projectContentContainer.addChild(projectHeader)
			projectContentContainer.addChild(projectDescription)
			projectContentContainer.addChild(skillsContainer)

			projectContentContainer.position.set(bgPadding / 2 - 4, bgPadding / 4)
			projectElementContainer.addChild(projectBg)
			projectElementContainer.addChild(projectContentContainer)
			const line = new Graphics().lineStyle(3, colors.cyanBright, 1).moveTo(0, 0).lineTo(projectBg.width - bgRightMargin, 0)
			line.position.set(bgLeftMargin, bgTopMargin + projectHeader.height + contentGap)

			projectElementContainer.addChild(line)

			projectElementContainer.position.set(x, y)
			x = projectElementContainer.x + projectElementContainer.width + gap

			if (i % 2 === 1) {
				y += projectElementContainer.height + gap
				x = 0
			}

			projectElementsContainer.addChild(projectElementContainer)
		})

		projectElementsContainer.position.set(projectsVisor.width + 170, -110)
		projectElementsContainer.alpha = 0


		projectsContainer.addChild(projectorLightContainer)
		projectsContainer.addChild(projectsVisorContainer)
		projectsContainer.addChild(projectElementsContainer)

		projectsContainer.position.set(-projectsVisor.width / 2, -1000)
		bgObjectsContainer.addChild(projectsContainer)
		let isInRange = false
		let isOpen = false
		{
			let x: (() => void) | undefined
			const playerDecoder = () => {
				isInRange = checkCollision(player, projectsVisorContainer, 150)
				if (isOpen) {
					if (x) {
						x()
						x = undefined
					}
					app.ticker.remove(playerDecoder)
					return
				}
				if (isInRange) {
					if (playerTutorialCleanupFunction)
						playerTutorialCleanupFunction()

					if (!x)
						x = spawnTexts(player, [`
						<div class="flex items-center gap-2 text-white font-body text-lg">press <span class="text-cyan-400 corner-border-small font-bold font-header !p-[1px_7px]">F</span> to view projects_</div>
					`], false)
				} else {
					if (x) {
						x()
						x = undefined
					}
				}
			}
			app.ticker.add(playerDecoder)
		}

		const openProjects = (e: KeyboardEvent) => {
			if (e.key.toLocaleLowerCase() === 'f' && isInRange) {
				isOpen = true
				lightParticles.emit = true

				window.removeEventListener('keydown', openProjects)
				const tl = gsap.timeline()
				const elems = [projectorLightContainer, projectElementsContainer]
				blink(elems, tl)
				blink(elems, tl)
				blink(elems, tl)

				tl.to(elems, {
					pixi: { alpha: 0.3 },
					duration: 0.5,
					ease: 'steps(1)',
					onStart: () => {
						lightParticles.emit = false
					}
				})

				tl.to(elems, {
					pixi: { alpha: 1 },
					duration: 2,
					ease: 'steps(1)',
					onStart: () => {
						lightParticles.emit = true
					}
				});

				(markers[1] as PIXI.Sprite).texture = PIXI.Texture.from('./assets/markerGreen.png')
			}
		}

		window.addEventListener('keydown', openProjects)
	}
	//end of sections
	// make markers for the sections if they are out of view
	const markersContainer = new PIXI.Container()
	markersContainer.name = 'markersContainer'
	markersContainer.position.set(app.screen.width / 2, app.screen.height / 2)

	app.stage.addChild(markersContainer)

	const markers: PIXI.Container[] = []
	const markerAnimations: gsap.core.Tween[] = []

	sections.forEach(() => {
		const marker = PIXI.Sprite.from('./assets/marker.png')
		marker.name = 'marker'
		marker.anchor.set(0.5)
		marker.width = 35
		marker.height = 27
		markers.push(marker)
		marker.alpha = 0
		markerAnimations.push(gsap.to(marker, {
			pixi: { alpha: 1 },
			duration: 0.2,
			ease: 'sine.inOut',
			paused: true,
		}))
		markersContainer.addChild(marker)
	})

	app.ticker.add((delta) => {
		let range = 150
		if (isGameLoaded)
			markers.forEach((marker, i) => {
				if (!checkCollision(player, sections[i], range)) {
					markerAnimations[i].play()

					// spawn a marker on the edge of the screen pointing to the section
					const angleOfSection = Math.atan2((sections[i].getGlobalPosition().y + sections[i].height / 2) - app.screen.height / 2, (sections[i].getGlobalPosition().x + sections[i].width / 2) - app.screen.width / 2)


					// put the marker on the edge of the screen
					const y = Math.sin(angleOfSection) * range
					const x = Math.cos(angleOfSection) * range

					marker.position.set(x, y)
					marker.rotation = angleOfSection + Math.PI / 2
				} else {
					markerAnimations[i].reverse()
				}
			})
	})


	const loadGame = () => {
		isGameLoaded = true
		outerGlowLoadingCircle.destroy()
		innerGlowLoadingCircle.destroy()
		ballContainer.destroy()

		playerTutorialCleanupFunction = spawnTexts(player, [
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

		{
			let x: NodeJS.Timeout | undefined
			let y = () => {
				if (w.isDown || a.isDown || s.isDown || d.isDown) {
					if (!x)
						x = setTimeout(() => {
							playerTutorialCleanupFunction()
							app.ticker.remove(y)
						}, 3000)
				}
			}
			app.ticker.add(y)
		}
	}
	gameContainer.scale.set(0.5)
	gameContainer.position.set(app.screen.width * gameContainer.scale.x / 2, app.screen.height * gameContainer.scale.y / 2)

	let mlf = 0.05, mf = 0.005, l = 0.4, f = 0.001
	// player movement
	// #region
	app.ticker.add((delta) => {
		let acceleration = 0.05 * delta
		// Set your desired maximum speeds for forward and reverse
		const maxForwardSpeed = 4;
		const maxReverseSpeed = 1;


		playerThrustParticles1.maxLifetime = mlf
		playerThrustParticles1.frequency = mf

		playerThrustParticles2.maxLifetime = mlf
		playerThrustParticles2.frequency = mf

		if (w.isDown || s.isDown) {
			const angle = playerContainer.rotation;
			const accelerationX = Math.sin(angle) * acceleration;
			const accelerationY = -Math.cos(angle) * acceleration;

			if (w.isDown) {
				playerThrustParticles1.maxLifetime = l
				playerThrustParticles1.frequency = f

				playerThrustParticles2.maxLifetime = l
				playerThrustParticles2.frequency = f

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
			playerContainer.angle -= 2 * delta
		}

		if (d.isDown) {
			playerContainer.angle += 2 * delta
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
