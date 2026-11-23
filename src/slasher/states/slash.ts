import type { AttackScanConfig } from "../scan";
import type { SlasherState } from "../shared";
import { calculateReducedDamage } from "@/lib/damage";
import { applyCameraShake, getFaceFrontLocation } from "@/lib/misc";
import { randomFloat } from "@/lib/number";
import * as vec3 from "@/lib/vec3";
import * as mc from "@minecraft/server";
import { scanForAttackTargets } from "../scan";
import { StateName } from "../shared";

const SLASH_DURATION = 0.35 * mc.TicksPerSecond;

const scanConfig: AttackScanConfig = {
	maxDistance: 8,
	sphereOffsets: Array.from({ length: 5 }, (_, i) => ({
		x: 0,
		y: 0,
		z: 0.5 + i * 0.75,
	})),
	sphereSize: 1,
};

export const SlashState: SlasherState = {
	name: StateName.Idle,

	onEnter({ s }) {
		if (s.player.getItemCooldown("slasher_slash_alt")) {
			s.player.startItemCooldown("slasher_slash_2", 2);
			s.player.startItemCooldown("slasher_slash_alt", 0);
		} else {
			s.player.startItemCooldown("slasher_slash_1", 2);
			s.player.startItemCooldown("slasher_slash_alt", 40);
		}

		s.dimension.playSound("slasher.slasher.slash", getFaceFrontLocation(s.player), {
			pitch: randomFloat(0.84, 1.03),
			volume: 1.2,
		});

		applyCameraShake(s.player, 0.06, 0.1, "rotational");
	},

	onTick({ s }) {
		if (s.fsm.currentTick === 2) {
			const targets = scanForAttackTargets(s.player, scanConfig);

			if (targets.length > 0) {
				s.dimension.playSound("slasher.slasher.slash_hit", getFaceFrontLocation(s.player), {
					volume: 1.2,
					pitch: randomFloat(0.93, 1.07),
				});

				s.player.startItemCooldown("slasher_slash_hitstop", 2);

				applyCameraShake(s.player, 0.12, 0.18, "rotational");

				mc.system.run(() => {
					attackTargets(s.player, targets);
				});
			}
		}

		if (s.fsm.currentTick < SLASH_DURATION) return;

		return StateName.Idle;
	},
};

function attackTargets(attacker: mc.Player, targets: mc.Entity[]): void {
	if (!attacker.isValid) return;

	for (const target of targets) {
		if (!target.isValid) continue;

		try {
			const damage = calculateReducedDamage(target, 5);
			target.applyDamage(damage, {
				cause: mc.EntityDamageCause.override,
				damagingEntity: attacker,
			});
		} catch {}
	}
}
