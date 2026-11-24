// JSX types for the native MathML elements the About page uses (React renders them; @types/react doesn't list them).
import type { HTMLAttributes } from 'react';

type MathProps = HTMLAttributes<HTMLElement> & {
  display?: 'block' | 'inline';
  mathvariant?: string;
  stretchy?: 'true' | 'false';
  lspace?: string;
  rspace?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathProps;
      mi: MathProps;
      mo: MathProps;
      mn: MathProps;
      mtext: MathProps;
      mrow: MathProps;
      msub: MathProps;
      msubsup: MathProps;
      mfrac: MathProps;
      munder: MathProps;
    }
  }
}
