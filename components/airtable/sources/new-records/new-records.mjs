import moment from "moment";
import { axios } from "@pipedream/platform";

import common from "../common.mjs";

export default {
  ...common,
  name: "New Records",
  description: "Emit an event for each new record in a table",
  key: "airtable-new-records",
  version: "0.2.0",
  type: "source",
  props: {
    ...common.props,
    tableId: {
      propDefinition: [
        common.props.airtable,
        "tableId",
        ({ baseId }) => ({
          baseId,
        }),
      ],
    },
  },
  async run() {
    const {
      baseId,
      tableId,
      viewId,
    } = this;

    const config = {
      url: `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
      params: {},
      headers: {
        Authorization: `Bearer ${this.airtable.$auth.api_key}`,
      },
    };

    const lastTimestamp = this.db.get("lastTimestamp");
    config.params.filterByFormula = `CREATED_TIME() > "${lastTimestamp}"`;

    const data = await axios(this, config);

    if (!data.records.length) {
      console.log("No new records.");
      return;
    }

    const metadata = {
      baseId,
      tableId,
      viewId,
    };

    let maxTimestamp;
    let recordCount = 0;
    for (const record of data.records) {
      record.metadata = metadata;

      this.$emit(record, {
        ts: moment(record.createdTime).valueOf(),
        summary: JSON.stringify(record.fields),
        id: record.id,
      });
      if (!maxTimestamp || moment(record.createdTime).valueOf() > moment(maxTimestamp).valueOf()) {
        maxTimestamp = record.createdTime;
      }
      recordCount++;
    }
    console.log(`Emitted ${recordCount} new records(s).`);
    this.db.set("lastTimestamp", maxTimestamp);
  },
};
