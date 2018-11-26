import * as THREE from 'three'
import './helper/GLTFLoader'
import './helper/SimplifyModifier'
import Stats from 'stats.js'
import * as dat from 'dat.gui'
import Config from '../data/config'

import OrbitControls from 'orbit-controls-es6'
import {MeshBasicMaterial} from 'three'
import {MeshLambertMaterial} from 'three'
import {Vector2} from 'three'

const SURF_RES = 14 // surfel resolution

export default class Main {
	constructor() {
		this.ray = new THREE.Raycaster()

		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

		this.camera2 = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000)
		this.cam2helper = new THREE.CameraHelper(this.camera2)
		this.scene.add(this.cam2helper)

		this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
		this.renderer.setClearColor(0xffffff, 0)

		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.renderer.sortObjects = false
		this.surfels = []

		this.camera.position.z = 1
		this.camera.position.x = 1
		this.camera.position.y = 1

		this.camera2.position.x = -0.2
		this.camera2.position.y = .1
		this.camera2.position.z = 1
		this.camera2.updateMatrixWorld(true)

		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.enabled = true
		this.controls.maxDistance = 1500
		this.controls.minDistance = 0


		document.body.style.margin = 0
		document.body.appendChild(this.renderer.domElement)

		this.addLights()

		window.addEventListener('resize', () => {
			let width = window.innerWidth
			let height = window.innerHeight

			this.renderer.setSize(width, height)

			this.camera.aspect = width / height
			this.camera.updateProjectionMatrix()
		})

		this.addStats()
		this.addGUI()
		this.loadModel()
		this.addHelpers()
		// let's render
		this.render()
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
			this.axisHelper = new THREE.AxesHelper(50)
			this.scene.add(this.axisHelper)
			this.axisHelper.visible = Config.visibility.axes
			this.gui_models.add(this.axisHelper, 'visible').name('x-y-z axes')
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

	addGUI() {
		let cam_ = this.camera
		let cam2_ = this.cam2helper
		let options = {
			face: this.camFace(cam_),
			center: this.camCenter(cam_),
			// update: this.updateCam(cam2_)
		}
		let self = this;

		var gui = new dat.GUI()

		// var cam = gui.addFolder('Cam (Main)')
		// cam.add(options, 'face')
		// cam.add(options, 'center')
		// var pos = cam.addFolder('Pos')
		// pos.add(cam_.position, 'x', -1, 1).listen()
		// pos.add(cam_.position, 'y', -1, 1).listen()
		// pos.add(cam_.position, 'z', -1, 1).listen()
		// pos.open()
		// var rot = cam.addFolder('Rot')
		// rot.add(cam_.rotation, 'x', -1, 1).listen()
		// rot.add(cam_.rotation, 'y', -1, 1).listen()
		// rot.add(cam_.rotation, 'z', -1, 1).listen()
		// rot.open()
		// cam.open()

		var cam2 = gui.addFolder('Cam (2)')
		let controllers = []
		var pos2 = cam2.addFolder('Position')
		controllers.push(pos2.add(cam2_.camera.position, 'x', -2, 2).step(0.1).listen())
		controllers.push(pos2.add(cam2_.camera.position, 'y', -2, 2).step(0.1).listen())
		controllers.push(pos2.add(cam2_.camera.position, 'z', -2, 2).step(0.1).listen())
		pos2.open()
		var rot2 = cam2.addFolder('Rotation')
		controllers.push(rot2.add(cam2_.camera.rotation, 'x', -2, 2).step(0.1).listen())
		controllers.push(rot2.add(cam2_.camera.rotation, 'y', -2, 2).step(0.1).listen())
		// controllers.push(rot2.add(cam2_.camera.rotation, 'z', -2, 2).step(0.1).listen())
		rot2.open()
		cam2.open()

		controllers.forEach(function (ctrl) {
			ctrl.onChange(function (value) {
				cam2_.camera.updateMatrixWorld(true)
				self.clearSurfels()
				self.addSurfels()
			})
		})


		this.gui_models = gui.addFolder('Visbility')
		this.gui_models.open()
		this.gui_surfels = gui.addFolder('Surfels (DEPENDENT ON CAM 2)')
		this.gui_surfels.open()
	}

	addSurfels() {
		this.mesh.visible = true;
		for (let x = -1; x < 1; x += (2 / SURF_RES)) {
			for (let y = -1; y < 1; y += (2 / SURF_RES)) {
				this.ray.setFromCamera(new Vector2(x, y), this.camera2)
				var intersects = this.ray.intersectObject(this.mesh)
				if (intersects.length > 0) {
					var intersect = intersects[0]
					var geometry = new THREE.PlaneGeometry(.1, .1)
					geometry.lookAt(intersect.face.normal)
					let scaling = 0.5*intersect.distance + 0.5*Math.pow(intersect.distance, 2) + 0.1
					geometry.scale(scaling, scaling, scaling)
					var material = new THREE.MeshBasicMaterial({color: 0xff00ff, side: THREE.DoubleSide})
					var plane = new THREE.Mesh(geometry, material)
					geometry.translate(intersect.point.x, intersect.point.y, intersect.point.z)
					this.scene.add(plane)
					this.surfels.push(plane)
				}
			}
		}
	}

	clearSurfels() {
		let self = this
		this.surfels.forEach(function (surfel) {
			self.scene.remove(surfel)
		})
	}

	loadModel() {
		var loader = new THREE.GLTFLoader()
		let scene_ = this.scene
		let self = this
		loader.load('assets/bunn.glb', function (gltf) {
			self.mesh = gltf.scene.children[0]
			self.mesh.geometry.center()
			self.mesh.scale.set(10, 10, 10)
			self.mesh.material = new MeshBasicMaterial({color: new THREE.Color(0x0000ff), transparent: true, opacity: 0.5})
			scene_.add(self.mesh)
			self.mesh.visible = Config.visibility.base
			self.gui_models.add(self.mesh, 'visible').name('ground truth').listen()
			self.gui_surfels.add(self, 'addSurfels').name("add surfels")
			self.gui_surfels.add(self, 'clearSurfels').name("clear all surfels")

			var modifier = new THREE.SimplifyModifier()
			var simplified = self.mesh.clone()
			simplified.geometry.center()
			simplified.scale.set(10, 10, 10)
			// simplified.position.x = 3
			simplified.material = new MeshLambertMaterial({wireframe: true, color: new THREE.Color(0xff0000)})

			simplified.material.flatShading = true
			var count = Math.floor(simplified.geometry.attributes.position.count * 0.875) // number of vertices to remove
			simplified.geometry = modifier.modify(simplified.geometry, count)

			self.bunn_mesh = simplified
			scene_.add(self.bunn_mesh)
			self.bunn_mesh.visible = Config.visibility.mesh
			self.gui_models.add(self.bunn_mesh, 'visible').name('mesh')

		}, undefined, function (error) {
			console.error(error)
		})

		loader.load('assets/bunn-voxel.glb', function (gltf) {
			var mesh = gltf.scene.children[0]

			mesh.geometry.center()
			mesh.scale.set(.029, .029, .029)
			mesh.rotateX(Math.PI * 3 / 2)
			// mesh.position.x = 2
			mesh.material = new MeshLambertMaterial({transparent: true, opacity: 0.5, color: new THREE.Color(0x00ff00)})

			self.bunn_voxel = mesh
			scene_.add(self.bunn_voxel)
			self.bunn_voxel.visible = Config.visibility.voxel
			self.gui_models.add(self.bunn_voxel, 'visible').name('voxel')

		}, undefined, function (error) {
			console.error(error)
		})

	}
}
