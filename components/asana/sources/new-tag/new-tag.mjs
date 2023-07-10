import asana from "../../asana.app.mjs";
import { DEFAULT_POLLING_SOURCE_TIMER_INTERVAL } from "@pipedream/platform";

export default {
  key: "asana-new-tag",
  type: "source",
  name: "New Tag",
  description: "Emit new event for each tag created in a workspace.",
  version: "0.0.4",
  dedupe: "unique",
  props: {
    asana,
    workspace: {
      label: "Workspace",
      description: "Gid of a workspace.",
      type: "string",
      propDefinition: [
        asana,
        "workspaces",
      ],
      optional: true,
    },
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: DEFAULT_POLLING_SOURCE_TIMER_INTERVAL,
      },
    },
  },

  async run() {
    const tags = await this.asana.getTags(this.organization);

    for (let tag of tags) {
      tag = await this.asana.getTag(tag.gid);

      if (this.workspace && tag.workspace.gid !== this.workspace) continue;

      this.$emit(tag, {
        id: tag.gid,
        summary: tag.name,
        ts: Date.now(),
      });
    }
  },
};
