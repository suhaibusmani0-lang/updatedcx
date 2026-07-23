Integration instructions for SignInPopup

1) Mount the popup once in a top-level layout (so it's available app-wide):

Example (in your root layout file):

```
import SignInPopup from '../components/SignInPopup';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SignInPopup />
      </body>
    </html>
  );
}
```

2) Wire your header's "Sign In" link to open the popup. Two options:

- Preferred (simple): call the global helper when the link is clicked:

```
<a href="#" onClick={(e) => { e.preventDefault(); window.showSignInPopup?.(); }}>Sign In</a>
```

- Alternative: dispatch an event (useful if you prefer not to reference globals):

```
<a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('open-signin-popup')); }}>Sign In</a>
```

Notes:
- The component uses inline styles to avoid requiring CSS changes.
- Authentication handling is left intentionally blank — replace the form submit handler with your auth logic or call existing auth utilities.
- No existing files were modified; add the `SignInPopup` import to your layout and add the small onClick to your header's Sign In link.
