
			// In case you haven't built the library yourself, replace URL with: https://www.unpkg.com/jolt-physics/dist/jolt-physics.wasm-compat.js
			import initJolt from './js/jolt-physics.wasm-compat.js';

			initJolt().then(function (Jolt) {
				// Spawning variables
				var objectTimePeriod = 0.01;
				var timeNextSpawn = time + objectTimePeriod;

				// Initialize this example
				initExample(Jolt, onUpdate);

				// Create a basic floor
				createFloor();

				function generateObject() {
					// Position and rotate body
					let pos = new Jolt.RVec3((Math.random() - 0.5) * 25, 15, (Math.random() - 0.5) * 25);
					let rot = getRandomQuat();

					// Create physics body
					let size = new Jolt.Vec3(0.5, 0.5, 0.5);
					let shape = new Jolt.BoxShape(size, 0.05, null);
					Jolt.destroy(size);
					let creationSettings = new Jolt.BodyCreationSettings(shape, pos, rot, Jolt.EMotionType_Dynamic, LAYER_MOVING);
					Jolt.destroy(pos);
					creationSettings.mRestitution = 0.5;
					let body = bodyInterface.CreateBody(creationSettings);
					Jolt.destroy(creationSettings);

					addToScene(body, 0xff0000);

					if (dynamicObjects.length > 200)
						removeFromScene(dynamicObjects[1]); // Leave the floor alone
				}

				function onUpdate(time, deltaTime) {
					// Check if its time to spawn a new object
					if (time > timeNextSpawn) {
						generateObject();
						timeNextSpawn = time + objectTimePeriod;
					}
				}
			});

		