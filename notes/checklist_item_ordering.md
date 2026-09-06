# Checklist Item Ordering

## How is sequence maintained? Is it saved in the DB?

Yes, the sequence **is saved to the database** — here's how it works end-to-end:

1. **MongoDB stores order implicitly** — `checklist_items` is a plain array (`[ChecklistItemSchema]`) in the `ChecklistSchema`. MongoDB preserves array element order exactly as stored, with no separate "position" field needed.

2. **The form submits in DOM order** — when you save, the form posts `checklist_items[0]`, `checklist_items[1]`, etc. based on the current order of rows in the DOM. The `reindexItems()` function (in `checklist_form.ejs`) renumbers those indices after every move, so the submitted indexes always match the visual order.

3. **The controller saves in submitted order** — both `createChecklist` and `updateChecklist` use `Object.values(itemsRaw)` which iterates the object keys in numeric order (`0, 1, 2...`), then saves the resulting `itemsArray` directly as `checklist_items`. This replaces the entire array in MongoDB with the new order.

4. **The view renders in stored order** — `checklist.checklist_items.forEach(...)` iterates the array as returned from MongoDB, so the saved order is what the user sees.

**In short:** move items with the arrows → save → the new order is persisted to MongoDB and will be reflected on every subsequent view.
