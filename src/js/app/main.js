import * as THREE from 'three'
import './helper/GLTFLoader'
import './helper/SimplifyModifier'
import Stats from 'stats.js'
import * as dat from 'dat.gui'
import Config from '../data/config'

import Cube from './blocks/cube'

import OrbitControls from 'orbit-controls-es6'
import {MeshBasicMaterial} from 'three'
import {MeshPhongMaterial} from 'three'
import {MeshLambertMaterial} from 'three'

export default class Main {
	constructor() {
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

		this.camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		this.cam2helper = new THREE.CameraHelper(this.camera2)
		this.scene.add(this.cam2helper)

		this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
		this.renderer.setClearColor(0xffffff, 0)

		this.renderer.setSize(window.innerWidth, window.innerHeight)

		this.camera.position.z = 1
		this.camera.position.x = 1
		this.camera.position.y = 1

		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.enabled = true
		this.controls.maxDistance = 1500
		this.controls.minDistance = 0


		document.body.style.margin = 0
		document.body.appendChild(this.renderer.domElement)

		this.addLights()
		// this.addHelpers()

		window.addEventListener('resize', () => {
			let width = window.innerWidth
			let height = window.innerHeight

			this.renderer.setSize(width, height)

			this.camera.aspect = width / height
			this.camera.updateProjectionMatrix()
		})

		this.loadAll()

		this.addStats()
		this.loadModel()
		this.addGUI()
		// let's render
		this.render()
	}

	loadAll() {
		// let cube = new Cube()
		// this.scene.add(cube.mesh)
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

	camFace(cam) {
		return function () {
			cam.position.z = .75
			cam.position.x = -.4
			cam.position.y = .5
			cam.lookAt(-.4, .5, .75)
		}
	}

	camCenter(cam) {
		return function () {
			// cam.position.z = 2
			// cam.position.x = 0
			// cam.position.y = 1
			// cam.lookAt(0,0,0)
			cam.position.z = 1
			cam.position.x = 1
			cam.position.y = 1
			cam.lookAt(0, 0, 0)
		}
	}

	updateCam(cam) {
		return function () {
			// cam.camera.updateProjectionMatrix()
			cam.camera.updateMatrixWorld(true)
			// cam.update()
		}
	}

	addGUI() {
		let cam_ = this.camera
		let cam2_ = this.cam2helper
		let options = {
			face: this.camFace(cam_),
			center: this.camCenter(cam_),
			update: this.updateCam(cam2_)
		}

		var gui = new dat.GUI()

		// var cam = gui.addFolder('Camera');
		// cam.add(options.camera, 'speed', 0, 0.0010).listen();
		// cam.add(camera.position, 'y', 0, 100).listen();
		// cam.open();
		//
		// var velocity = gui.addFolder('Velocity');
		// velocity.add(options, 'velx', -0.2, 0.2).name('X').listen();
		// velocity.add(options, 'vely', -0.2, 0.2).name('Y').listen();
		// velocity.open();
		//
		// var box = gui.addFolder('Cube');
		// box.add(cube.scale, 'x', 0, 3).name('Width').listen();
		// box.add(cube.scale, 'y', 0, 3).name('Height').listen();
		// box.add(cube.scale, 'z', 0, 3).name('Length').listen();
		// box.add(cube.material, 'wireframe').listen();
		// box.open();

		var cam = gui.addFolder('Cam (Main)')
		cam.add(options, 'face')
		cam.add(options, 'center')
		var pos = cam.addFolder('Pos')
		pos.add(cam_.position, 'x', -1, 1).listen()
		pos.add(cam_.position, 'y', -1, 1).listen()
		pos.add(cam_.position, 'z', -1, 1).listen()
		pos.open()
		var rot = cam.addFolder('Rot')
		rot.add(cam_.rotation, 'x', -1, 1).listen()
		rot.add(cam_.rotation, 'y', -1, 1).listen()
		rot.add(cam_.rotation, 'z', -1, 1).listen()
		rot.open()
		cam.open()

		var cam2 = gui.addFolder('Cam (2)')
		cam2.add(options, 'update')
		var pos2 = cam2.addFolder('Pos')
		pos2.add(cam2_.camera.position, 'x', -2, 2).step(0.2).listen()
		pos2.add(cam2_.camera.position, 'y', -2, 2).step(0.2).listen()
		pos2.add(cam2_.camera.position, 'z', -2, 2).step(0.2).listen()
		pos2.open()
		var rot2 = cam2.addFolder('Rot')
		rot2.add(cam2_.camera.rotation, 'x', -2, 2).step(0.2).listen()
		rot2.add(cam2_.camera.rotation, 'y', -2, 2).step(0.2).listen()
		rot2.add(cam2_.camera.rotation, 'z', -2, 2).step(0.2).listen()
		rot2.open()
		cam2.open()
	}

	loadModel() {
		var loader = new THREE.GLTFLoader()
		let scene_ = this.scene
		loader.load('assets/bunn.glb', function (gltf) {
			var mesh = gltf.scene.children[0]
			mesh.geometry.center()
			mesh.scale.set(10, 10, 10)
			mesh.material = new MeshBasicMaterial({color: new THREE.Color(0x0000ff), transparent: true, opacity: 0.5})
			scene_.add(mesh)

			var modifier = new THREE.SimplifyModifier()
			var simplified = mesh.clone()
			simplified.geometry.center()
			simplified.scale.set(10, 10, 10)
			// simplified.position.x = 3
			simplified.material = new MeshLambertMaterial({wireframe: true, color: new THREE.Color(0xff0000)})

			simplified.material.flatShading = true
			var count = Math.floor(simplified.geometry.attributes.position.count * 0.875) // number of vertices to remove
			simplified.geometry = modifier.modify(simplified.geometry, count)
			scene_.add(simplified)

		}, undefined, function (error) {
			console.error(error)
		})
	}
}
