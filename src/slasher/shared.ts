import type { FsmState } from "@/lib/fsm";
import type { SlasherSession } from "./session";

export const SLASHER_TYPE_ID = "slasher:slasher";

export type ActionName = (typeof ActionName)[keyof typeof ActionName];
export const ActionName = {
	Slash: "slash",
	Slam: "slam",
} as const;

export type StateName = (typeof StateName)[keyof typeof StateName];
export const StateName = {
	Idle: "idle",
	Slash: "slash",
	SlamReady: "slamReady",
	SlamClash: "slamClash",
	StabWindup: "stabWindup",
	StabThrust: "stabThrust",
} as const;

export type StateContext = {
	s: SlasherSession;
};

export type SlasherState = FsmState<StateContext>;
