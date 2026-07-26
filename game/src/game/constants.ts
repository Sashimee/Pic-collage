/**
 * Every distance here is a *pitch design unit* (roughly a metre), independent of
 * screen size — the camera scales the world for display, exactly like the board
 * units in the collage app. Tuning the game means editing this file, not the
 * components.
 */

export const PITCH = {
  /** The goal line. The ball travels towards -z. */
  goalZ: -14,
  /** Half of the goal mouth. Deliberately generous: a 6-year-old must score. */
  goalHalfWidth: 4.2,
  goalHeight: 3.2,
  /** Post thickness, used for the "clonk" outcome and for rendering. */
  postRadius: 0.16,
  ballRadius: 0.34,
  ballStart: { x: 0, y: 0.34, z: 1.6 },
  groundY: 0,
  /** Where the crowd stands, for the stadium ring. */
  pitchHalfWidth: 11,
} as const

export const PHYSICS = {
  /** Lighter than real gravity: shots hang in the air and read as graceful. */
  gravity: -11,
  /** Air drag per second. Keeps long shots from flying forever. */
  drag: 0.12,
  /** Energy kept after a ground bounce. */
  restitution: 0.55,
  /** Horizontal slow-down applied once per bounce. */
  bounceFriction: 0.72,
  /** Rolling resistance, per second, while the ball sits on the grass. */
  rollFriction: 0.9,
  /** Impact speed below which the ball rolls instead of bouncing. */
  restThreshold: 0.8,
  /** Simulation is sub-stepped to this size so a fast ball never tunnels. */
  maxStep: 1 / 120,
} as const

export const SHOT = {
  /** Speed at the weakest possible flick — still reaches the goal. */
  minSpeed: 15,
  /** Speed at a full-length flick. */
  maxSpeed: 23,
  /**
   * Widest sideways angle a flick can produce, in radians (~20.6°).
   *
   * The goal mouth seen from the penalty spot only subtends ~15°, so a full
   * sideways flick aims a little *past* the post and lands inside ASSIST's
   * rescue band — meaning the ball is never lost sideways, and the only thing
   * standing between the child and a goal is the keeper. A wider angle here was
   * the single biggest difficulty bug: at 0.55 rad two thirds of all flicks
   * flew outside the posts.
   */
  maxAngle: 0.3,
  /**
   * Sideways drag, as a fraction of viewport width, that produces the full
   * angle. Aim and power are read from separate axes — horizontal drag steers,
   * vertical drag powers — because coupling them (via the swipe angle) means a
   * hard shot is also an inaccurate one, which is exactly backwards for a
   * 6-year-old.
   */
  lateralFullFraction: 0.2,
  /**
   * Upward speed range. Tuned against PHYSICS.gravity so that even a full-power
   * shot arrives *under* the 3.2 crossbar — a child who swipes as hard as they
   * can should not be punished with a ball over the roof.
   */
  minLift: 3.2,
  maxLift: 6.5,
  /** An upward flick shorter than this fraction of the screen is just a tap. */
  minDragFraction: 0.05,
  /** Upward drag (fraction of screen height) that means "full power". */
  fullPowerFraction: 0.4,
} as const

export const ASSIST = {
  /**
   * Near-miss magnetism. A shot predicted to cross the goal line within this
   * many units *outside* a post is bent back in. This is the single most
   * important kindness in the game: it turns "so close!" into "GOAL!" without
   * the child ever noticing a nudge.
   */
  outerBand: 1.6,
  /** Where an assisted shot is aimed, as a fraction of the goal half-width. */
  targetFraction: 0.78,
  /** Shots already this far inside the goal are left completely alone. */
  innerGuard: 0.9,
} as const

export const KEEPER = {
  startX: 0,
  /** Sideways travel of the patrol, in units from the centre. */
  patrolRange: 2.4,
  /** Slow enough that a child can watch it, learn it, and beat it. */
  patrolSpeed: 1.5,
  /** How far the keeper can reach sideways when the ball crosses the line. */
  reach: 1.15,
  /** Anything above this height sails over the keeper. */
  reachHeight: 2.0,
  /** Length of the dive animation, seconds. */
  diveDuration: 0.45,
} as const

export const ROUND = {
  shotsPerRound: 5,
  /** Stars are never zero — see starsFor(). */
  starsForPerfect: 3,
} as const

/** How long the ball is allowed to be in flight before the shot is called. */
export const SHOT_TIMEOUT = 4.5
