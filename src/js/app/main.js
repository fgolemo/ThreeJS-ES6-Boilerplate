import * as THREE from 'three'
import Stats from 'stats.js'

import Config from '../data/config'

import Cube from './blocks/cube'

import OrbitControls from 'orbit-controls-es6'

export default class Main {
	constructor() {
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
		this.renderer.setClearColor( 0xffffff, 0);

		this.renderer.setSize(window.innerWidth, window.innerHeight)

		this.camera.position.z = 5
		this.camera.position.x = 5
		this.camera.position.y = 5

		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.enabled = true
		this.controls.maxDistance = 1500
		this.controls.minDistance = 0


		document.body.style.margin = 0
		document.body.appendChild(this.renderer.domElement)

		this.addLights()
		this.addHelpers()

		window.addEventListener('resize', () => {
			let width = window.innerWidth
			let height = window.innerHeight

			this.renderer.setSize(width, height)

			this.camera.aspect = width / height
			this.camera.updateProjectionMatrix()
		})

		this.loadAll()

		this.addStats()

		// let's render
		this.render()
	}

	loadAll() {
		let cube = new Cube()
		this.scene.add(cube.mesh)
	}

	render() {
		if (Config.isDev) {
			this.stats.begin()
		}

		this.renderer.render(this.scene, this.camera)

		if (Config.isDev) {
			this.stats.end()
		}

		requestAnimationFrame(this.render.bind(this))
	}

	addLights() {
		let ambientLight = new THREE.AmbientLight(0x999999)
		this.scene.add(ambientLight)

		let light = new THREE.PointLight(0xffffff, 1, 0)
		light.position.set(0, 100, 0)
		this.scene.add(light)
	}

	addHelpers() {
		if (Config.isDev) {
			let axisHelper = new THREE.AxesHelper(50)
			this.scene.add(axisHelper)
		}
	}

	addStats() {
		if (Config.isDev) {
			this.stats = new Stats()
			this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild(this.stats.domElement)
		}
	}
}
