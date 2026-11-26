// Runtime settings for the spatooJr pages. Every tunable number lives here with its default.
//
// Override any of them in the container with an env var named APP_<KEY>, for example
//   APP_PARALLAX_X=8  APP_TILT_RANGE_DEG=25
// The nginx container writes those into /runtime-config.js at start (docker/40-runtime-config.sh).
// Outside the container (npm run dev, npm run build served statically), the defaults below are used.
//
// Values that are not numbers are ignored with a console warning, and the default is used instead.

const defaults = {
    // Camera parallax: how far the backdrop camera moves for a full mouse or tilt range.
    // Higher = more movement = more sensitive.
    PARALLAX_X: 6,
    PARALLAX_Y: 4,

    // Gyro: degrees of device tilt (from the pose when the page opened) that reach the edge of the range.
    // Lower = more sensitive.
    TILT_RANGE_DEG: 40,
    // Android only: ms to wait for motion data before showing the "Tap to enable tilt" hint.
    TILT_HINT_AFTER_MS: 1500,
    // Distance of the tilt hint from the bottom of the screen, in px.
    TILT_HINT_BOTTOM_PX: 48,

    // Backdrop scene (boidBackdrop.js).
    BG_CAMERA_FOV: 60,
    BG_CAMERA_NEAR: 0.1,
    BG_CAMERA_FAR: 2000,
    BG_CENTER_Z: -60,            // distance of the swarm centre in front of the camera
    BG_AMBIENT_INTENSITY: 1.2,
    BG_SUN_INTENSITY: 2.5,
    BG_STAR_COUNT: 3000,
    BG_STAR_MIN_RADIUS: 300,     // stars sit on a shell from this radius...
    BG_STAR_RADIUS_RANGE: 500,   // ...out to this many units further out
    BG_STAR_SIZE: 1.5,
    BG_SKY_FACE_PX: 1024,        // resolution of each skybox face
    BG_MAX_PIXEL_RATIO: 2,
    BG_MAX_FRAME_DT: 0.05,       // seconds; longer frames are clamped so the flock doesn't jump

    // Flock (boidBackdrop.js). Units are scene units, scaled down from the Unity project.
    FLOCK_COUNT: 60,
    FLOCK_INNER_RADIUS: 5,       // separation radius
    FLOCK_OUTER_RADIUS: 10,      // cohesion and alignment radius
    FLOCK_SPEED: 12,
    FLOCK_MAX_GROUP_SIZE: 6,     // GroupedBoidManager.maxBoidGroupSize
    FLOCK_SPAWN_RADIUS: 20,      // boids start within this distance of the centre
    FLOCK_CAGE_RADIUS: 35,       // soft boundary around the centre
    FLOCK_CAGE_STRENGTH: 2,
    FLOCK_MODEL_LENGTH: 3,       // longest side of the assembled fodder model
    FLOCK_SEPARATION_WEIGHT: 1.2,
    FLOCK_COHESION_WEIGHT: 0.6,
    FLOCK_ALIGNMENT_WEIGHT: 0.6,
    FLOCK_STEER_RATE: 4,         // how fast the steering force is applied
    FLOCK_MIN_SPEED_RATIO: 0.5,  // boids never slow below this fraction of FLOCK_SPEED

    // Logo in the panel (logo3d.js).
    LOGO_CAMERA_FOV: 35,
    LOGO_CAMERA_DISTANCE: 60,    // further away = less perspective change as the hydra turns
    LOGO_CAMERA_NEAR: 0.1,
    LOGO_CAMERA_FAR: 500,
    LOGO_SPIN_SPEED: 0.5,        // radians per second
    LOGO_FIT_MARGIN: 0.85,       // fraction of the canvas the logo may fill
    LOGO_FIT_SAMPLES: 36,        // angles sampled through one turn when measuring the logo
    LOGO_TEXT_OFFSET_Y: -1.5,    // text position below the hydra
    LOGO_TEXT_SIZE: 1,
    LOGO_TEXT_DEPTH: 0.1,
    LOGO_TEXT_CURVE_SEGMENTS: 12,
    LOGO_TEXT_BEVEL_SIZE: 0.02,
    LOGO_TEXT_BEVEL_THICKNESS: 0.15,
    LOGO_MAX_PIXEL_RATIO: 2,
}

const env = (typeof window !== 'undefined' && window.APP_ENV) || {}

export const config = {}
for (const [key, fallback] of Object.entries(defaults)) {
    const raw = env[key]
    if (raw === undefined || raw === '') {
        config[key] = fallback
        continue
    }
    const value = Number(raw)
    if (Number.isFinite(value)) {
        config[key] = value
    } else {
        console.warn(`APP_${key}="${raw}" is not a number. Using ${fallback}.`)
        config[key] = fallback
    }
}
