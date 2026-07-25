/* @ds-bundle: {"format":3,"namespace":"SGTLDesignSystem_3ded94","components":[{"name":"DataField","sourcePath":"components/cards/DataField.jsx"},{"name":"FeatureCard","sourcePath":"components/cards/FeatureCard.jsx"},{"name":"MetricCard","sourcePath":"components/cards/MetricCard.jsx"},{"name":"PricingCard","sourcePath":"components/cards/PricingCard.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"StatItem","sourcePath":"components/feedback/StatItem.jsx"},{"name":"VerifiedBadge","sourcePath":"components/feedback/VerifiedBadge.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"VerifyField","sourcePath":"components/forms/VerifyField.jsx"}],"sourceHashes":{"components/cards/DataField.jsx":"94641dfea472","components/cards/FeatureCard.jsx":"29581c89191d","components/cards/MetricCard.jsx":"05a2ab6034c5","components/cards/PricingCard.jsx":"c84cfbffd096","components/core/Badge.jsx":"377cdbe6c8f1","components/core/Button.jsx":"00bc8dd4ffa4","components/core/Eyebrow.jsx":"3cd1c2c41d61","components/feedback/StatItem.jsx":"579386f12c91","components/feedback/VerifiedBadge.jsx":"0e519a2e90f3","components/forms/TextInput.jsx":"32223eae7c38","components/forms/VerifyField.jsx":"aea5a921d811"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SGTLDesignSystem_3ded94 = window.SGTLDesignSystem_3ded94 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/DataField.jsx
try { (() => {
/**
 * DataField — a label/value pair for the verified-report info grid and
 * certificate specs. Uppercase muted label over a mono, tabular value.
 * Lives on light surfaces (the verification app).
 */
function DataField({
  label,
  value,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      color: "var(--muted)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      fontSize: 14,
      color: "var(--ink)",
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "0.01em"
    }
  }, value));
}
Object.assign(__ds_scope, { DataField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/DataField.jsx", error: String((e && e.message) || e) }); }

// components/cards/FeatureCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FeatureCard — the dark-surface feature tile from the marketing site.
 * Glyph icon in a soft gold tile, title, one-line description. On hover
 * it lifts -4px, brightens its fill, and warms its border toward gold.
 */
function FeatureCard({
  icon = "\u25C6",
  title,
  children,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      padding: "32px 28px",
      border: `1px solid ${hover ? "rgba(196,148,63,0.15)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: "var(--radius-lg)",
      background: hover ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
      transform: hover ? "translateY(-4px)" : "none",
      transition: "all var(--dur-base) var(--ease-signature)",
      fontFamily: "var(--font-body)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: "var(--radius-md)",
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      marginBottom: 18,
      background: "rgba(196,148,63,0.10)",
      color: "var(--gold-soft)"
    }
  }, icon), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontSize: 17,
      fontWeight: 700,
      color: "#fff"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--text-on-dark-muted)"
    }
  }, children));
}
Object.assign(__ds_scope, { FeatureCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/FeatureCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/MetricCard.jsx
try { (() => {
/**
 * MetricCard — the admin console dashboard metric. Dark card with a
 * left accent bar in one of four status hues, an uppercase label, a big
 * value (JetBrains Mono, tabular), and a sub caption.
 */
function MetricCard({
  label,
  value,
  sub,
  tone = "gold",
  style = {}
}) {
  const tones = {
    gold: "var(--gold)",
    blue: "var(--status-blue)",
    orange: "var(--status-orange)",
    green: "var(--status-green)"
  };
  const accent = tones[tone] || tones.gold;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "20px 22px",
      background: "var(--bg-card)",
      border: "1px solid var(--border, rgba(196,148,63,0.12))",
      borderRadius: "var(--radius)",
      overflow: "hidden",
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      background: accent
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "var(--console-text-muted)",
      marginBottom: 10
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-console)",
      fontSize: 32,
      fontWeight: 600,
      color: "var(--console-text)",
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums"
    }
  }, value), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--console-text-dim)",
      marginTop: 8
    }
  }, sub));
}
Object.assign(__ds_scope, { MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PricingCard.jsx
try { (() => {
/**
 * PricingCard — a dark pricing tier. Title, price note, a teal-checked
 * feature list, and a CTA. `featured` adds the gold "Most Popular" ribbon
 * and a warm gold-tinted fill + border.
 */
function PricingCard({
  title,
  note,
  features = [],
  ctaLabel = "Contact Us",
  featured = false,
  onSelect = () => {},
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: "relative",
      padding: "34px 32px",
      display: "flex",
      flexDirection: "column",
      border: `1px solid ${featured ? "rgba(196,148,63,0.55)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: "var(--radius-lg)",
      background: featured ? "linear-gradient(180deg, rgba(196,148,63,0.09), rgba(255,255,255,0.015)), rgba(10,18,21,0.48)" : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), rgba(10,18,21,0.42)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      transform: hover ? "translateY(-4px)" : "none",
      transition: "all var(--dur-base) var(--ease-signature)",
      fontFamily: "var(--font-body)",
      ...style
    }
  }, featured && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: -14,
      left: "50%",
      transform: "translateX(-50%)",
      background: "var(--grad-gold)",
      color: "#1c160b",
      fontSize: 11.5,
      fontWeight: 700,
      padding: "6px 18px",
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      boxShadow: "0 10px 22px rgba(0,0,0,0.22)"
    }
  }, "Most Popular"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 7px",
      fontSize: 17,
      fontWeight: 700,
      color: "#fff"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-on-dark-faint)",
      marginBottom: 24
    }
  }, note), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: "0 0 26px",
      padding: 0,
      flex: 1
    }
  }, features.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      position: "relative",
      padding: "8px 0 8px 30px",
      fontSize: 13,
      lineHeight: 1.55,
      color: "var(--text-on-dark-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 0,
      top: 9,
      width: 16,
      height: 16,
      border: "1px solid rgba(13,107,99,0.75)",
      borderRadius: "50%",
      background: "rgba(13,107,99,0.16)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 6,
      top: 11,
      width: 4,
      height: 8,
      border: "solid rgba(225,245,238,0.9)",
      borderWidth: "0 1.5px 1.5px 0",
      transform: "rotate(45deg)"
    }
  }), f))), /*#__PURE__*/React.createElement("button", {
    onClick: onSelect,
    style: {
      width: "100%",
      padding: 12,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: "inherit",
      borderRadius: "var(--radius-sm)",
      cursor: "pointer",
      border: featured ? "none" : "1px solid rgba(255,255,255,0.15)",
      background: featured ? "var(--grad-gold)" : "transparent",
      color: featured ? "#1c160b" : "#fff",
      transition: "all var(--dur-base) var(--ease-signature)"
    }
  }, ctaLabel));
}
Object.assign(__ds_scope, { PricingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PricingCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — the pill capsule. Two jobs in the SG&TL UI:
 *  · hero badge ("◆ Trusted by 500+ jewellers") — variant="hero"
 *  · trust chips ("SSL Secured", "ISO Certified") — variant="trust"
 * `tone` controls accent (gold | teal). Leading glyph via `icon`.
 */
function Badge({
  children,
  variant = "hero",
  tone = "gold",
  icon = null,
  style = {},
  ...rest
}) {
  const accent = tone === "teal" ? "13,107,99" : "196,148,63";
  const text = tone === "teal" ? "var(--teal-light)" : "var(--gold-soft)";
  const variants = {
    hero: {
      padding: "8px 18px",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.06em",
      border: `1px solid rgba(${accent},0.25)`,
      background: `rgba(${accent},0.06)`,
      color: text
    },
    trust: {
      padding: "7px 14px",
      fontSize: 12,
      fontWeight: 600,
      border: `1px solid rgba(${accent},0.18)`,
      background: `rgba(${accent},0.05)`,
      color: text
    },
    solid: {
      padding: "6px 16px",
      fontSize: 11.5,
      fontWeight: 700,
      background: "var(--grad-gold)",
      color: "#1c160b"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-body)",
      lineHeight: 1,
      ...variants[variant],
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SG&TL Button — the auric CTA and its quieter siblings.
 * Primary = gold gradient with a gold glow that deepens + lifts on hover.
 * Secondary = teal gradient (submits / positive actions).
 * Ghost / outline = hairline border, used on dark and light alike.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  as = "button",
  icon = null,
  iconRight = null,
  fullWidth = false,
  disabled = false,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: "8px 16px",
      fontSize: 12.5
    },
    md: {
      padding: "13px 26px",
      fontSize: 14
    },
    lg: {
      padding: "15px 32px",
      fontSize: 15
    }
  };
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: fullWidth ? "100%" : "auto",
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    lineHeight: 1,
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "transform var(--dur-base) var(--ease-signature), box-shadow var(--dur-base) var(--ease-signature), background var(--dur-base), border-color var(--dur-base)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: "var(--grad-gold)",
      color: "#1c160b",
      boxShadow: "var(--shadow-cta)"
    },
    secondary: {
      background: "var(--grad-teal)",
      color: "#ffffff",
      boxShadow: "0 6px 20px rgba(13,107,99,0.25)"
    },
    ghost: {
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.22)",
      color: "rgba(255,255,255,0.85)"
    },
    outline: {
      background: "transparent",
      border: "1px solid rgba(196,148,63,0.45)",
      color: "var(--gold-ink)"
    }
  };
  const Tag = as;
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? variant === "primary" ? {
    transform: "translateY(-2px)",
    boxShadow: "var(--shadow-cta-hover)"
  } : variant === "secondary" ? {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 28px rgba(13,107,99,0.35)"
  } : variant === "ghost" ? {
    borderColor: "rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.05)"
  } : {
    borderColor: "rgba(196,148,63,0.7)",
    background: "rgba(196,148,63,0.06)"
  } : {};
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      ...base,
      ...variants[variant],
      ...hoverStyle,
      ...style
    },
    disabled: as === "button" ? disabled : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, rest), icon, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Eyebrow — the small uppercase gold kicker that sits above section
 * headings and hero H1s. Optional leading rule (the 24px gold line).
 * Use `tone="ink"` on light surfaces for AAA contrast.
 */
function Eyebrow({
  children,
  tone = "gold",
  rule = true,
  style = {},
  ...rest
}) {
  const color = tone === "ink" ? "var(--gold-ink)" : "var(--gold)";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-eyebrow)",
      fontWeight: 700,
      letterSpacing: "var(--tracking-eyebrow)",
      textTransform: "uppercase",
      color,
      ...style
    }
  }, rest), rule && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 1,
      background: color,
      display: "inline-block"
    }
  }), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatItem.jsx
try { (() => {
/**
 * StatItem — a single trust metric (number over label). On the hero these
 * sit in a row divided by thin vertical rules rather than boxed cards, so
 * `divided` draws a right hairline. Works on dark and light via `tone`.
 */
function StatItem({
  number,
  label,
  tone = "dark",
  divided = false,
  style = {}
}) {
  const numColor = tone === "dark" ? "var(--gold-soft)" : "var(--gold-ink)";
  const labelColor = tone === "dark" ? "var(--text-on-dark-faint)" : "var(--muted)";
  const rule = tone === "dark" ? "rgba(255,255,255,0.10)" : "var(--line)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "0 clamp(16px,3vw,32px)",
      borderRight: divided ? `1px solid ${rule}` : "none",
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: numColor,
      marginBottom: 4
    }
  }, number), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: labelColor
    }
  }, label));
}
Object.assign(__ds_scope, { StatItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatItem.jsx", error: String((e && e.message) || e) }); }

// components/feedback/VerifiedBadge.jsx
try { (() => {
/**
 * VerifiedBadge — the teal check-mark that strokes itself on, followed by
 * the uppercase "VERIFIED" wordmark popping in. Shown after a successful
 * certificate lookup. Pass a unique `id` if several mount at once.
 */
function VerifiedBadge({
  label = "Verified",
  id = "vb",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        @keyframes ${id}-stroke { to { stroke-dashoffset: 0; } }
        @keyframes ${id}-pop { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .${id}-c { stroke: var(--teal); stroke-width: 2; fill: none; stroke-dasharray: 166; stroke-dashoffset: 166; animation: ${id}-stroke 0.6s var(--ease-spring) forwards; }
        .${id}-p { stroke: var(--teal); stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 48; stroke-dashoffset: 48; animation: ${id}-stroke 0.35s var(--ease-spring) 0.5s forwards; }
        .${id}-t { color: var(--teal); animation: ${id}-pop 0.4s ease 0.6s both; }
      `), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 52 52",
    style: {
      width: 42,
      height: 42
    }
  }, /*#__PURE__*/React.createElement("circle", {
    className: `${id}-c`,
    cx: "26",
    cy: "26",
    r: "25"
  }), /*#__PURE__*/React.createElement("path", {
    className: `${id}-p`,
    d: "M14.1 27.2l7.1 7.2 16.7-16.8"
  })), /*#__PURE__*/React.createElement("span", {
    className: `${id}-t`,
    style: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: "0.5px",
      textTransform: "uppercase"
    }
  }, label));
}
Object.assign(__ds_scope, { VerifiedBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/VerifiedBadge.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TextInput — the light-surface form field used across the verification
 * app and enquiry forms. Paper background, hairline border, gold focus
 * ring (paper→white on focus). Set mono for report-number entry.
 */
function TextInput({
  label = null,
  mono = false,
  suffix = null,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const field = {
    flex: 1,
    width: "100%",
    padding: "14px 18px",
    fontSize: 15,
    fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
    fontWeight: mono ? 500 : 400,
    letterSpacing: mono ? "0.06em" : "normal",
    color: "var(--ink)",
    background: focus ? "var(--white)" : "var(--paper)",
    border: `1.5px solid ${focus ? "var(--gold)" : "var(--line)"}`,
    borderRadius: "var(--radius-md)",
    outline: "none",
    boxShadow: focus ? "0 0 0 4px var(--focus-ring)" : "none",
    transition: "all var(--dur-base) var(--ease-signature)",
    boxSizing: "border-box"
  };
  const input = /*#__PURE__*/React.createElement("input", _extends({
    style: suffix ? {
      ...field,
      border: "none",
      background: "transparent",
      boxShadow: "none",
      padding: "12px 0",
      flex: 1
    } : field,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest));
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginBottom: 6,
      fontSize: 12,
      fontWeight: 600,
      color: "var(--muted)",
      fontFamily: "var(--font-body)"
    }
  }, label), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: focus ? "var(--white)" : "var(--paper)",
      border: `1.5px solid ${focus ? "var(--gold)" : "var(--line)"}`,
      borderRadius: "var(--radius-md)",
      padding: "0 16px",
      boxShadow: focus ? "0 0 0 4px var(--focus-ring)" : "none",
      transition: "all var(--dur-base) var(--ease-signature)"
    }
  }, input, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--subtle)",
      fontSize: 14,
      userSelect: "none"
    }
  }, suffix)) : input);
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/VerifyField.jsx
try { (() => {
/**
 * VerifyField — the signature certificate-lookup input group.
 * A mono, auto-uppercasing report-number input fused to a gold "Verify"
 * button, with an optional status line below (checking / error / idle).
 * This is the focal instrument of the verification app.
 */
function VerifyField({
  placeholder = "SGTL-2026-XXXX",
  buttonLabel = "Verify",
  status = null,
  // { state: "idle"|"checking"|"error", text }
  defaultValue = "",
  onVerify = () => {},
  style = {}
}) {
  const [value, setValue] = React.useState(defaultValue);
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const statusColor = status?.state === "error" ? "var(--ruby)" : status?.state === "checking" ? "var(--gold-ink)" : "var(--muted)";
  return /*#__PURE__*/React.createElement("div", {
    style: style
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onVerify(value);
    },
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => setValue(e.target.value.toUpperCase()),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    placeholder: placeholder,
    spellCheck: false,
    autoComplete: "off",
    style: {
      flex: 1,
      padding: "14px 18px",
      fontFamily: "var(--font-mono)",
      fontSize: 15,
      fontWeight: 500,
      letterSpacing: "0.06em",
      color: "var(--ink)",
      background: focus ? "var(--white)" : "var(--paper)",
      border: `1.5px solid ${focus ? "var(--gold)" : "var(--line)"}`,
      borderRadius: "var(--radius-md)",
      outline: "none",
      boxShadow: focus ? "0 0 0 4px var(--focus-ring)" : "none",
      transition: "all var(--dur-base) var(--ease-signature)"
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      padding: "14px 24px",
      fontFamily: "var(--font-body)",
      fontSize: 14,
      fontWeight: 700,
      color: "#1c160b",
      background: "var(--grad-gold)",
      border: "none",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      whiteSpace: "nowrap",
      boxShadow: hover ? "var(--shadow-cta-hover)" : "0 6px 20px rgba(196,148,63,0.25)",
      transform: hover ? "translateY(-2px)" : "none",
      transition: "all var(--dur-base) var(--ease-signature)"
    }
  }, buttonLabel)), status?.text && /*#__PURE__*/React.createElement("p", {
    style: {
      minHeight: 20,
      marginTop: 12,
      fontSize: 13,
      color: statusColor,
      textAlign: "center",
      fontFamily: "var(--font-body)"
    }
  }, status.text));
}
Object.assign(__ds_scope, { VerifyField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/VerifyField.jsx", error: String((e && e.message) || e) }); }

__ds_ns.DataField = __ds_scope.DataField;

__ds_ns.FeatureCard = __ds_scope.FeatureCard;

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.PricingCard = __ds_scope.PricingCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.StatItem = __ds_scope.StatItem;

__ds_ns.VerifiedBadge = __ds_scope.VerifiedBadge;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.VerifyField = __ds_scope.VerifyField;

})();
