import * as mc from "@minecraft/server";

// disable fall damage on slam
mc.world.beforeEvents.entityHurt.subscribe(
	(ev) => {
		if (!(ev.hurtEntity instanceof mc.Player)) return;
		if (ev.damageSource.cause !== mc.EntityDamageCause.fall) return;
		if (!ev.hurtEntity.getItemCooldown("slasher_slam_fall")) return;

		ev.cancel = true;
	},
	{ entityFilter: { type: "minecraft:player" } },
);
