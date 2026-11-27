import type { SlasherState } from "../shared";
import { getFaceFrontLocation } from "@/lib/misc";
import { randomFloat } from "@/lib/number";
import * as vec3 from "@/lib/vec3";
import * as mc from "@minecraft/server";
import { StateName } from "../shared";

const WINDUP_DURATION = 0.5 * mc.TicksPerSecond;
const THRUST_DURATION = 0.45 * mc.TicksPerSecond;

const LUNGE_REV_COMSUMPTION = 20;

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
		s.player.startItemCooldown("slasher_stab_thrust", 2);

		const moveVec = s.player.inputInfo.getMovementVector();
		const powerful = moveVec.y > 0.4 && s.revState.consumeRev(LUNGE_REV_COMSUMPTION);

		s.dimension.playSound("slasher.slasher.slash", getFaceFrontLocation(s.player), {
			pitch: powerful ? 0.9 : randomFloat(1.0, 1.1),
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
	},

	onTick({ s }) {
		if (s.fsm.currentTick >= THRUST_DURATION) return StateName.Idle;
	},
};
