import { type Extension, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

const COLOR_RE =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)/gi;

function build(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    COLOR_RE.lastIndex = 0;
    let m: RegExpExecArray | null = null;
    // biome-ignore lint/suspicious/noAssignInExpressions: regex match loop
    while ((m = COLOR_RE.exec(text)) !== null) {
      const start = from + m.index;
      const end = start + m[0].length;
      builder.add(
        start,
        end,
        Decoration.mark({
          attributes: { class: "cm-color-swatch" },
          side: -1,
        }),
      );
    }
  }
  return builder.finish();
}

export function colorSwatches(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = build(view);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged) this.decorations = build(u.view);
      }
    },
    { decorations: (v) => v.decorations },
  );
}
