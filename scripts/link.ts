import fs from "node:fs/promises";
import path from "node:path";

const comMojang = process.env["COM_MOJANG"];

if (comMojang === undefined) {
	console.error("Please set env var 'COM_MOJANG' to the com.mojang directory path");
	process.exit(1);
}

const bpLinkPath = path.join(comMojang, "development_behavior_packs", "slasher-bp");
const rpLinkPath = path.join(comMojang, "development_resource_packs", "slasher-rp");

const remove = process.argv[2] === "remove";

if (remove) {
	await fs.unlink(bpLinkPath);
	console.log("Removed symlink:", bpLinkPath);

	await fs.unlink(rpLinkPath);
	console.log("Removed symlink:", rpLinkPath);
} else {
	await fs.symlink(path.resolve("packs/bp"), bpLinkPath, "junction");
	console.log("Created symlink:", bpLinkPath);

	await fs.symlink(path.resolve("packs/rp"), rpLinkPath, "junction");
	console.log("Created symlink:", rpLinkPath);
}
