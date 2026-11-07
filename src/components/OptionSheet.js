// A short list of choices with a tick, e.g. "Sorted by".
import { Group, ListRow, Sheet, SheetTitle } from "./ui";

export default function OptionSheet({ visible, title, options, value, onPick, onClose }) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <SheetTitle>{title}</SheetTitle>
      <Group style={{ marginBottom: 8 }}>
        {options.map((o, i) => (
          <ListRow key={o.value} label={o.label} checked={o.value === value} last={i === options.length - 1} onPress={() => onPick(o.value)} />
        ))}
      </Group>
    </Sheet>
  );
}
