import * as mc from "@minecraft/server";

type QueuedAction<TAction extends string> = {
	action: TAction;
	tick: number;
};

export class InputBuffer<TAction extends string = string> {
	private queue: QueuedAction<TAction>[] = [];

	constructor(private readonly bufferWindow = 2) {}

	push(action: TAction) {
		this.queue.push({ action, tick: mc.system.currentTick });
	}

	prune() {
		this.queue = this.queue.filter((i) => mc.system.currentTick - i.tick <= this.bufferWindow);
	}

	consume(action: TAction): boolean {
		const idx = this.queue.findIndex((i) => i.action === action);
		if (idx === -1) return false;
		this.queue.splice(idx, 1);
		return true;
	}
}
