import { dialogueData, scaleFactor } from "./constants";
import {k} from "./kaplayCtx";
import { displayDialogue, setCamScale } from "./utils";

// Spritesheet and animations

k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,
        "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
        "idle-side": 975,
        "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
        "idle-up": 1014,
        "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 }
    },
});

k.loadSprite("map", "./map.png");

k.setBackground(k.Color.fromHex("#311047"));

// -------------------------------------------------------------

// Player

k.scene("main", async () => {
    const mapData = await (await fetch("./map.json")).json()
    const layers = mapData.layers;
    const map = k.add([
        k.sprite("map"),
        k.pos(0), 
        k.scale(scaleFactor),
    ]);

    const player = k.make([
        k.sprite("spritesheet", {anims: "idle-down"}), k.area({
            shape: new k.Rect(k.vec2(0, 3), 10, 10),
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player", 
    ]);

    for (const layer of layers) {
        if(layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({ isStatic: true }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ]);

                if(boundary.name) {
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true;
                        displayDialogue(dialogueData[boundary.name], () => {
                            player.isInDialogue = false;
                        })
                    })
                }
            }
            continue;
        }
        if(layer.name === "spawnpoints") {
            for(const entity of layer.objects) {
                if(entity.name === "player") {
                    player.pos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor,
                    );
                    k.add(player);
                    player.play("idle-down"); // add this line since the sprite is only loaded and not displaying the correct player sprite, so I activate the animation
                    continue;
                }
            }
        }
    }

    setCamScale(k);

    k.onResize(() => {
        setCamScale(k);
    })

    k.onUpdate(() => {
        k.setCamPos(player.pos.x, player.pos.y + 100);
    });
    
// -------------------------------------------------------------

// Apply animations on mouse events - click / hold

    k.onMouseDown((mouseBtn) => {
        if(mouseBtn !== "left" || player.isInDialogue) return;
        const worldMousePos = k.toWorld(k.mousePos());
        if (player.pos.dist(worldMousePos) < 2) return;
        
        player.moveTo(worldMousePos, player.speed);

        const mouseAngle = player.pos.angle(worldMousePos);

        const lowerBound = 50;
        const upperBound = 125;

        if(
            mouseAngle > lowerBound &&
            mouseAngle < upperBound &&
            player.getCurAnim() !== "walk-up"
        ) {
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        if(
            mouseAngle < -lowerBound &&
            mouseAngle > -upperBound &&
            player.getCurAnim() !== "walk-down"
        ) {
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        if(Math.abs(mouseAngle) > upperBound) {
            player.flipX = false;
            if(player.getCurAnim() !== "walk-side") player.play("walk-side");
            player.direction = "right";
            return;
        }

        if(Math.abs(mouseAngle) < lowerBound) {
            player.flipX = true;
            if(player.getCurAnim() !== "walk-side") player.play("walk-side");
            player.direction = "left";
            return;
        } 
    });

// -------------------------------------------------------------

// Stop animations on mouse events - release

    k.onMouseRelease(() => {
        if(player.direction === "down") {
            player.play("idle-down");
            return;
        }

        if(player.direction === "up") {
            player.play("idle-up");
            return;
        }

       player.play("idle-side");
    })
});



k.go("main");