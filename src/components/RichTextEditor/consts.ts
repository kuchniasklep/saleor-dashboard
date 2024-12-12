// @ts-strict-ignore
import strikethroughIcon from "@dashboard/icons/StrikethroughIcon";
import { ToolConstructable, ToolSettings } from "@editorjs/editorjs";
import Embed from "@editorjs/embed";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";
import Quote from "@editorjs/quote";
import Table from "@editorjs/table";
import createGenericInlineTool from "editorjs-inline-tool";

const inlineToolbar = ["link", "bold", "italic", "strikethrough"];

export const tools: Record<string, ToolConstructable | ToolSettings> = {
  embed: Embed,
  header: {
    class: Header,
    inlineToolbar,
    config: {
      defaultLevel: 1,
      levels: [1, 2, 3],
    },
  },
  list: {
    class: List,
    inlineToolbar,
    config: {
      defaultStyle: 'unordered'
    },
  },
  table: {
    class: Table,
    inlineToolbar,
    config: {
      rows: 3,
      cols: 2,
      maxRows: 5,
      maxCols: 5,
    },
  } as unknown as ToolConstructable,
  quote: {
    class: Quote,
    inlineToolbar,
  },
  paragraph: {
    class: Paragraph,
    inlineToolbar,
  } as unknown as ToolConstructable,
  strikethrough: createGenericInlineTool({
    sanitize: {
      s: {},
    },
    shortcut: "CMD+S",
    tagName: "s",
    toolboxIcon: strikethroughIcon,
  }),
};
