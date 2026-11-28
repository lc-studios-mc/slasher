import type { SlasherSession } from "../session";
import type { SlasherState } from "../shared";
import { calculateReducedDamage } from "@/lib/damage";
import { getFaceFrontLocation } from "@/lib/misc";
import { randomFloat } from "@/lib/number";
import * as vec3 from "@/lib/vec3";
import * as mc from "@minecraft/server";
import { scanForAttackTargets } from "../scan";
import { StateName } from "../shared";

const WINDUP_DURATION = 0.4 * mc.TicksPerSecond;
const THRUST_DURATION = 0.4 * mc.TicksPerSecond;
const LUNGE_REV_COMSUMPTION = 20;
const ATTACK_DAMAGE = 7;
const ATTACK_WINDOW = 0.25 * mc.TicksPerSecond;

const scanSphereOffsets: mc.Vector3[] = Array.from({ length: 11 }, (_, i) => ({
	x: 0,
	y: 0,
	z: 0.3 + i * 0.4,
}));
const sphereSize = 0.7;

export const StabWindupState: SlasherState = {
	name: StateName.StabWindup,

	onEnter({ s }) {
		s.player.startItemCooldown("slasher_stab_windup", 2);

		s.dimension.playSound("slasher.slasher.stab.windup", getFaceFrontLocation(s.player), {
			pitch: randomFloat(0.95, 1.05),
			volume: 1.5,
		});
	},

	onTick({ s }) {
		if (s.fsm.currentTick >= WINDUP_DURATION) return StateName.StabThrust;
	},
};

export const StabThrustState: SlasherState = {
	name: StateName.StabThrust,

	onEnter({ s }) {
		s.stabAlreadyScanned = [];
		s.stabRotation = s.player.getRotation();

		s.player.startItemCooldown("slasher_stab_thrust", 2);

		const moveVec = s.player.inputInfo.getMovementVector();
		const powerful =
			!s.player.isOnGround && moveVec.y > 0.4 && s.revState.consumeRev(LUNGE_REV_COMSUMPTION);

		s.dimension.playSound("slasher.slasher.slash", getFaceFrontLocation(s.player), {
			pitch: randomFloat(0.88, 0.98),
			volume: 1.5,
		});

		const viewDir = s.player.getViewDirection();
		const force = vec3.create();
		force.z = powerful ? 1.49 : 0.4;
		force.y = 0.05;
		vec3.setDirection(force, force, viewDir);

		const yVel = s.player.getVelocity().y;
		if (!s.player.isGliding && yVel < 0) {
			s.player.applyImpulse({ x: 0, y: -yVel, z: 0 });
		}

		s.player.applyImpulse(force);

		attack(s);
	},

	onExit({ s }) {
		s.stabAlreadyScanned = [];
	},

	onTick({ s }) {
		if (s.fsm.currentTick >= THRUST_DURATION) return StateName.Idle;

		if (s.fsm.currentTick < 3) {
			s.stabRotation = s.player.getRotation();
		}

		if (s.fsm.currentTick > ATTACK_WINDOW) return;

		attack(s);
	},
};

function attack(s: SlasherSession) {
	const targets = scanForAttackTargets(s.player, {
		maxDistance: 8,
		sphereOffsets: scanSphereOffsets,
		sphereSize,
		rotation: s.stabRotation,
		isValidTarget: (entity) => !s.stabAlreadyScanned.includes(entity),
	});

	if (targets.length > 0) {
		s.dimension.playSound("slasher.slasher.thud", getFaceFrontLocation(s.player), {
			pitch: randomFloat(0.93, 1.07),
			volume: 1.4,
		});
	}

	for (const target of targets) {
		s.stabAlreadyScanned.push(target);

		try {
			const damage = calculateReducedDamage(target, ATTACK_DAMAGE);
			target.applyDamage(damage, {
				cause: mc.EntityDamageCause.override,
				damagingEntity: s.player,
			});
		} catch {}
	}
}
