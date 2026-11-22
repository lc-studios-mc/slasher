export interface FsmState<TContext = unknown> {
	readonly name: string;
	onEnter?(ctx: TContext): string | undefined;
	onExit?(ctx: TContext): void;
	onTick?(ctx: TContext): string | undefined;
}

export class Fsm<TContext = unknown> {
	private _hasStarted = false;
	private _current: FsmState<TContext> | null = null;
	private _currentTick = 0;

	constructor(
		private readonly states: Readonly<Record<string, FsmState<TContext>>>,
		private readonly initial: string,
	) {}

	get hasStarted(): boolean {
		return this._hasStarted;
	}

	get currentState(): FsmState<TContext> {
		this.throwIfNotStarted();
		return this._current!;
	}

	get currentTick(): number {
		this.throwIfNotStarted();
		return this._currentTick;
	}

	start(ctx: TContext): void {
		if (this._hasStarted) return;

		this._current = this.requireState(this.initial);
		this._hasStarted = true;

		const t = this._current.onEnter?.(ctx);
		if (t !== undefined) this.changeState(t, ctx);
	}

	tick(ctx: TContext): void {
		this.throwIfNotStarted();

		const t = this._current!.onTick?.(ctx);
		if (t !== undefined) this.changeState(t, ctx);
		else this._currentTick++;
	}

	changeState(to: string, ctx: TContext): void {
		this.throwIfNotStarted();

		this._current!.onExit?.(ctx);
		this._current = this.requireState(to);
		this._currentTick = 0;

		const t = this._current.onEnter?.(ctx);
		if (t !== undefined) this.changeState(t, ctx);
	}

	private requireState(name: string): FsmState<TContext> {
		const state = this.states[name];
		if (!state) throw new Error(`Requested state '${name}' does not exist.`);
		return state;
	}

	private throwIfNotStarted(): void {
		if (this._hasStarted) return;
		throw new Error("This Fsm has not been started. Call Fsm.start() first.");
	}
}
