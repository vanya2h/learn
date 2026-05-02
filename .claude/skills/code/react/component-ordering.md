# Component ordering within a file

Define components top-down like a table of contents: the main (exported) component of the file comes first, followed by every secondary component in the order it is first used. Never define a helper component above the component that uses it.

```tsx
// good
export default function TopicStudy() {      // main component — first
  return <NavButton />;
}

function NavButton() { ... }                // used by TopicStudy — second
function NavButtonIcon() { ... }            // used by NavButton — third

// bad — helper defined before the component that uses it
function NavButton() { ... }
export default function TopicStudy() { ... }
```
