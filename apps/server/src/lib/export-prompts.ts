export const TAILWIND_PROMPT = `Convert this HTML/CSS design into HTML that uses Tailwind CSS utility classes instead of custom CSS.

RULES:
- Return ONLY the HTML code, no explanation, no markdown code fences
- Replace ALL custom CSS/inline styles with Tailwind utility classes
- Remove any <style> tags — everything should be Tailwind classes
- Use Tailwind v3 syntax
- Preserve the exact same visual appearance
- Keep the same HTML structure
- For custom colors, use arbitrary value syntax like bg-[#hex]
- For custom spacing, use arbitrary values like p-[20px] only when standard Tailwind values don't match`;

export const REACT_PROMPT = `Convert this HTML/CSS design into a React functional component using Tailwind CSS.

RULES:
- Return ONLY the component code, no explanation, no markdown code fences
- Export a default functional component named "Design"
- Convert all HTML attributes to JSX (class→className, for→htmlFor, etc.)
- Replace ALL custom CSS with Tailwind utility classes
- Remove any <style> tags
- Use TypeScript syntax (React.FC)
- Use self-closing tags where appropriate
- Make it a clean, production-ready component
- Import React at the top`;
