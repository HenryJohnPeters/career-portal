/**
 * Avatar2D.tsx
 *
 * Lightweight 2D avatar with lip-sync animation.
 * Uses pure SVG graphics - no external APIs needed, 100% free.
 * Each interviewer has a unique, realistic appearance.
 */

import type { MouthShape } from "../hooks/use2DAvatarLipSync";
import type { InterviewerConfig } from "../interviewer-configs";

interface Avatar2DProps {
  interviewer: InterviewerConfig;
  mouthShape: MouthShape;
  isSpeaking: boolean;
}

// SVG mouth shapes for lip-sync animation - MOVED LOWER
const MOUTH_SHAPES: Record<MouthShape, JSX.Element> = {
  closed: (
    <path
      d="M85 130 Q100 128 115 130"
      fill="none"
      stroke="#E85D75"
      strokeWidth="4"
      strokeLinecap="round"
    />
  ),
  open: (
    <ellipse cx="100" cy="132" rx="10" ry="8" fill="#E85D75" opacity="0.9" />
  ),
  wide: (
    <>
      <ellipse cx="100" cy="135" rx="15" ry="12" fill="#C94A5E" opacity="0.9" />
      <ellipse cx="100" cy="135" rx="10" ry="8" fill="#1a1a1a" opacity="0.3" />
    </>
  ),
  smile: (
    <path
      d="M85 128 Q100 135 115 128"
      fill="none"
      stroke="#E85D75"
      strokeWidth="4"
      strokeLinecap="round"
    />
  ),
  round: (
    <ellipse cx="100" cy="132" rx="8" ry="10" fill="#E85D75" opacity="0.9" />
  ),
  small: (
    <ellipse cx="100" cy="132" rx="6" ry="6" fill="#E85D75" opacity="0.9" />
  ),
  thinking: (
    <path
      d="M88 130 L112 130"
      fill="none"
      stroke="#E85D75"
      strokeWidth="3"
      strokeLinecap="round"
    />
  ),
};

// Alex - Warm, friendly female engineer with curly auburn hair
function AlexAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        {/* Gradient for hair shine */}
        <radialGradient id="alexHairShine" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#B85C3E" />
          <stop offset="100%" stopColor="#8B3A2A" />
        </radialGradient>
        {/* Skin gradient */}
        <radialGradient id="alexSkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#FFD4B8" />
          <stop offset="100%" stopColor="#E8B298" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#10b981" opacity="0.15" />

      {/* Neck */}
      <ellipse cx="100" cy="160" rx="25" ry="35" fill="url(#alexSkin)" />

      {/* Shoulders/Clothing */}
      <path
        d="M 60 180 Q 75 170 100 175 Q 125 170 140 180 L 150 240 L 50 240 Z"
        fill="#10b981"
        opacity="0.85"
      />

      {/* Curly hair - background */}
      <ellipse cx="100" cy="75" rx="70" ry="60" fill="url(#alexHairShine)" />

      {/* Curly hair texture - left side */}
      <circle cx="55" cy="80" r="18" fill="#B85C3E" opacity="0.8" />
      <circle cx="45" cy="100" r="16" fill="#B85C3E" opacity="0.7" />
      <circle cx="50" cy="120" r="14" fill="#B85C3E" opacity="0.6" />

      {/* Curly hair texture - right side */}
      <circle cx="145" cy="80" r="18" fill="#B85C3E" opacity="0.8" />
      <circle cx="155" cy="100" r="16" fill="#B85C3E" opacity="0.7" />
      <circle cx="150" cy="120" r="14" fill="#B85C3E" opacity="0.6" />

      {/* Top curls */}
      <circle cx="85" cy="50" r="15" fill="#B85C3E" />
      <circle cx="100" cy="45" r="16" fill="#B85C3E" />
      <circle cx="115" cy="50" r="15" fill="#B85C3E" />

      {/* Face */}
      <ellipse cx="100" cy="105" rx="50" ry="55" fill="url(#alexSkin)" />

      {/* Ears */}
      <ellipse cx="52" cy="105" rx="8" ry="12" fill="#E8B298" />
      <ellipse cx="148" cy="105" rx="8" ry="12" fill="#E8B298" />

      {/* Eyes - warm brown */}
      <ellipse cx="80" cy="95" rx="8" ry="10" fill="white" />
      <ellipse cx="120" cy="95" rx="8" ry="10" fill="white" />
      <circle cx="80" cy="97" r="6" fill="#5C4033" />
      <circle cx="120" cy="97" r="6" fill="#5C4033" />
      <circle cx="82" cy="95" r="2.5" fill="white" opacity="0.9" />
      <circle cx="122" cy="95" r="2.5" fill="white" opacity="0.9" />

      {/* Eyebrows - friendly arch */}
      <path
        d="M 68 85 Q 80 82 92 85"
        fill="none"
        stroke="#8B3A2A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 108 85 Q 120 82 132 85"
        fill="none"
        stroke="#8B3A2A"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Nose */}
      <path
        d="M 100 100 L 100 115"
        stroke="#D9A688"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 95 113 Q 100 116 105 113"
        fill="none"
        stroke="#D9A688"
        strokeWidth="1.5"
      />

      {/* Cheek blush */}
      <ellipse cx="70" cy="115" rx="12" ry="8" fill="#FF9B9B" opacity="0.3" />
      <ellipse cx="130" cy="115" rx="12" ry="8" fill="#FF9B9B" opacity="0.3" />

      {/* Smile crinkles */}
      <path
        d="M 68 96 Q 72 98 75 96"
        fill="none"
        stroke="#D9A688"
        strokeWidth="0.5"
        opacity="0.4"
      />
      <path
        d="M 125 96 Q 128 98 132 96"
        fill="none"
        stroke="#D9A688"
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
  );
}

// Morgan - Professional female with sleek black hair and glasses
function MorganAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        <linearGradient id="morganHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2C3E50" />
          <stop offset="100%" stopColor="#1a252f" />
        </linearGradient>
        <radialGradient id="morganSkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#F5D5C3" />
          <stop offset="100%" stopColor="#D4B5A3" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#3b82f6" opacity="0.15" />

      {/* Neck */}
      <ellipse cx="100" cy="160" rx="23" ry="35" fill="url(#morganSkin)" />

      {/* Shoulders/Blazer */}
      <path
        d="M 55 180 Q 70 170 100 175 Q 130 170 145 180 L 155 240 L 45 240 Z"
        fill="#2C3E50"
      />
      <path d="M 85 175 L 95 240" stroke="#3b82f6" strokeWidth="2" />
      <path d="M 115 175 L 105 240" stroke="#3b82f6" strokeWidth="2" />

      {/* Sleek hair - main */}
      <ellipse cx="100" cy="70" rx="68" ry="55" fill="url(#morganHair)" />

      {/* Side part */}
      <path
        d="M 85 40 Q 95 45 100 50"
        fill="none"
        stroke="#1a252f"
        strokeWidth="2"
      />

      {/* Hair strands - left */}
      <path d="M 35 95 Q 40 130 50 150" fill="url(#morganHair)" />
      <path d="M 45 95 Q 48 130 55 150" fill="url(#morganHair)" />

      {/* Hair strands - right */}
      <path d="M 165 95 Q 160 130 150 150" fill="url(#morganHair)" />
      <path d="M 155 95 Q 152 130 145 150" fill="url(#morganHair)" />

      {/* Face */}
      <ellipse cx="100" cy="105" rx="48" ry="54" fill="url(#morganSkin)" />

      {/* Ears with earrings */}
      <ellipse cx="54" cy="105" rx="7" ry="11" fill="#D4B5A3" />
      <ellipse cx="146" cy="105" rx="7" ry="11" fill="#D4B5A3" />
      <circle cx="54" cy="115" r="3" fill="#3b82f6" opacity="0.8" />
      <circle cx="146" cy="115" r="3" fill="#3b82f6" opacity="0.8" />

      {/* Glasses frame */}
      <rect
        x="62"
        y="88"
        width="30"
        height="22"
        fill="none"
        stroke="#2C3E50"
        strokeWidth="2"
        rx="3"
      />
      <rect
        x="108"
        y="88"
        width="30"
        height="22"
        fill="none"
        stroke="#2C3E50"
        strokeWidth="2"
        rx="3"
      />
      <line x1="92" y1="97" x2="108" y2="97" stroke="#2C3E50" strokeWidth="2" />

      {/* Glasses shine */}
      <rect
        x="64"
        y="90"
        width="10"
        height="8"
        fill="white"
        opacity="0.4"
        rx="1"
      />
      <rect
        x="110"
        y="90"
        width="10"
        height="8"
        fill="white"
        opacity="0.4"
        rx="1"
      />

      {/* Eyes - dark brown */}
      <ellipse cx="77" cy="97" rx="6" ry="8" fill="white" />
      <ellipse cx="123" cy="97" rx="6" ry="8" fill="white" />
      <circle cx="77" cy="98" r="5" fill="#3E2723" />
      <circle cx="123" cy="98" r="5" fill="#3E2723" />
      <circle cx="79" cy="96" r="2" fill="white" opacity="0.9" />
      <circle cx="125" cy="96" r="2" fill="white" opacity="0.9" />

      {/* Eyebrows - defined */}
      <path
        d="M 66 83 Q 77 80 88 82"
        fill="none"
        stroke="#1a252f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 112 82 Q 123 80 134 83"
        fill="none"
        stroke="#1a252f"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Nose - refined */}
      <path
        d="M 100 100 L 100 114"
        stroke="#C9A893"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="95" cy="114" rx="2" ry="2" fill="#C9A893" opacity="0.6" />
      <ellipse cx="105" cy="114" rx="2" ry="2" fill="#C9A893" opacity="0.6" />

      {/* Subtle contour */}
      <path
        d="M 65 105 Q 62 115 65 125"
        fill="none"
        stroke="#C9A893"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M 135 105 Q 138 115 135 125"
        fill="none"
        stroke="#C9A893"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}

// Jordan - Confident male with short styled hair and beard
function JordanAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        <linearGradient id="jordanHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4A4A4A" />
          <stop offset="100%" stopColor="#2C2C2C" />
        </linearGradient>
        <radialGradient id="jordanSkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#E8C4A8" />
          <stop offset="100%" stopColor="#C9A588" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#f97316" opacity="0.15" />

      {/* Neck - thicker */}
      <ellipse cx="100" cy="160" rx="28" ry="38" fill="url(#jordanSkin)" />

      {/* Shoulders/Shirt */}
      <path
        d="M 50 185 Q 65 172 100 177 Q 135 172 150 185 L 160 240 L 40 240 Z"
        fill="#f97316"
        opacity="0.9"
      />
      {/* Collar */}
      <path d="M 85 177 L 78 185 L 85 190" fill="#2C2C2C" opacity="0.3" />
      <path d="M 115 177 L 122 185 L 115 190" fill="#2C2C2C" opacity="0.3" />

      {/* Short styled hair - top */}
      <ellipse cx="100" cy="62" rx="62" ry="40" fill="url(#jordanHair)" />

      {/* Hair fade on sides */}
      <path d="M 40 85 Q 45 75 50 90" fill="#4A4A4A" opacity="0.5" />
      <path d="M 160 85 Q 155 75 150 90" fill="#4A4A4A" opacity="0.5" />

      {/* Textured top */}
      <path
        d="M 85 55 Q 90 45 95 55"
        fill="none"
        stroke="#2C2C2C"
        strokeWidth="2"
      />
      <path
        d="M 100 50 Q 102 40 105 50"
        fill="none"
        stroke="#2C2C2C"
        strokeWidth="2"
      />
      <path
        d="M 105 55 Q 110 45 115 55"
        fill="none"
        stroke="#2C2C2C"
        strokeWidth="2"
      />

      {/* Face - angular */}
      <path
        d="M 52 95 Q 50 110 55 130 L 60 145 Q 80 160 100 160 Q 120 160 140 145 L 145 130 Q 150 110 148 95 Q 145 75 100 75 Q 55 75 52 95"
        fill="url(#jordanSkin)"
      />

      {/* Ears */}
      <ellipse cx="52" cy="105" rx="8" ry="13" fill="#C9A588" />
      <ellipse cx="148" cy="105" rx="8" ry="13" fill="#C9A588" />

      {/* Beard/Stubble */}
      <ellipse
        cx="100"
        cy="135"
        rx="35"
        ry="25"
        fill="#4A4A4A"
        opacity="0.25"
      />
      <path d="M 70 120 Q 100 145 130 120" fill="#4A4A4A" opacity="0.15" />

      {/* Goatee */}
      <ellipse cx="100" cy="142" rx="12" ry="10" fill="#2C2C2C" opacity="0.4" />

      {/* Eyes - intense hazel */}
      <ellipse cx="78" cy="95" rx="8" ry="10" fill="white" />
      <ellipse cx="122" cy="95" rx="8" ry="10" fill="white" />
      <circle cx="78" cy="96" r="6" fill="#6B5B3E" />
      <circle cx="122" cy="96" r="6" fill="#6B5B3E" />
      <circle cx="80" cy="94" r="2.5" fill="white" opacity="0.9" />
      <circle cx="124" cy="94" r="2.5" fill="white" opacity="0.9" />

      {/* Eyebrows - strong */}
      <path
        d="M 65 83 Q 78 78 90 81"
        fill="none"
        stroke="#2C2C2C"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 110 81 Q 122 78 135 83"
        fill="none"
        stroke="#2C2C2C"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Nose - strong */}
      <path
        d="M 100 98 L 100 118"
        stroke="#B89578"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 94 116 Q 100 120 106 116"
        fill="none"
        stroke="#B89578"
        strokeWidth="2"
      />
      <ellipse cx="94" cy="117" rx="2.5" ry="2" fill="#B89578" opacity="0.6" />
      <ellipse cx="106" cy="117" rx="2.5" ry="2" fill="#B89578" opacity="0.6" />

      {/* Jawline definition */}
      <path
        d="M 60 130 Q 65 140 75 145"
        fill="none"
        stroke="#B89578"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <path
        d="M 140 130 Q 135 140 125 145"
        fill="none"
        stroke="#B89578"
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  );
}

// Sam - Strategic tech lead with silver-gray hair and glasses
function SamAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        <linearGradient id="samHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B8B8B" />
          <stop offset="100%" stopColor="#5A5A5A" />
        </linearGradient>
        <radialGradient id="samSkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#E8CFBB" />
          <stop offset="100%" stopColor="#C9B09B" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#a855f7" opacity="0.15" />

      {/* Neck */}
      <ellipse cx="100" cy="160" rx="26" ry="36" fill="url(#samSkin)" />

      {/* Shoulders/Sweater */}
      <path
        d="M 52 185 Q 68 173 100 177 Q 132 173 148 185 L 158 240 L 42 240 Z"
        fill="#a855f7"
        opacity="0.8"
      />

      {/* Distinguished silver hair */}
      <ellipse cx="100" cy="65" rx="65" ry="48" fill="url(#samHair)" />

      {/* Side sweep */}
      <path d="M 45 85 Q 50 70 60 85" fill="#8B8B8B" opacity="0.7" />
      <path d="M 155 85 Q 150 70 140 85" fill="#8B8B8B" opacity="0.7" />

      {/* Face */}
      <ellipse cx="100" cy="108" rx="50" ry="56" fill="url(#samSkin)" />

      {/* Ears */}
      <ellipse cx="52" cy="108" rx="8" ry="13" fill="#C9B09B" />
      <ellipse cx="148" cy="108" rx="8" ry="13" fill="#C9B09B" />

      {/* Round glasses */}
      <circle
        cx="77"
        cy="95"
        r="15"
        fill="none"
        stroke="#5A5A5A"
        strokeWidth="2.5"
      />
      <circle
        cx="123"
        cy="95"
        r="15"
        fill="none"
        stroke="#5A5A5A"
        strokeWidth="2.5"
      />
      <line
        x1="92"
        y1="95"
        x2="108"
        y2="95"
        stroke="#5A5A5A"
        strokeWidth="2.5"
      />

      {/* Glasses reflection */}
      <circle cx="72" cy="90" r="5" fill="white" opacity="0.5" />
      <circle cx="118" cy="90" r="5" fill="white" opacity="0.5" />

      {/* Eyes - wise gray-blue */}
      <ellipse cx="77" cy="97" rx="6" ry="8" fill="white" />
      <ellipse cx="123" cy="97" rx="6" ry="8" fill="white" />
      <circle cx="77" cy="98" r="5" fill="#5B7C99" />
      <circle cx="123" cy="98" r="5" fill="#5B7C99" />
      <circle cx="79" cy="96" r="2" fill="white" opacity="0.9" />
      <circle cx="125" cy="96" r="2" fill="white" opacity="0.9" />

      {/* Eyebrows - thoughtful */}
      <path
        d="M 64 82 Q 77 79 90 81"
        fill="none"
        stroke="#5A5A5A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 110 81 Q 123 79 136 82"
        fill="none"
        stroke="#5A5A5A"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Nose */}
      <path
        d="M 100 100 L 100 118"
        stroke="#B89E88"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="95" cy="117" rx="2" ry="2" fill="#B89E88" opacity="0.6" />
      <ellipse cx="105" cy="117" rx="2" ry="2" fill="#B89E88" opacity="0.6" />

      {/* Subtle smile lines */}
      <path
        d="M 65 105 Q 63 112 65 120"
        fill="none"
        stroke="#B89E88"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M 135 105 Q 137 112 135 120"
        fill="none"
        stroke="#B89E88"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}

// Riley - Creative frontend specialist with colorful highlights
function RileyAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        <linearGradient id="rileyHair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A3B5C" />
          <stop offset="50%" stopColor="#6B5B7C" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <radialGradient id="rileySkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#FFE4D4" />
          <stop offset="100%" stopColor="#F0CDB8" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#06b6d4" opacity="0.15" />

      {/* Neck */}
      <ellipse cx="100" cy="160" rx="24" ry="34" fill="url(#rileySkin)" />

      {/* Shoulders/Top */}
      <path
        d="M 58 182 Q 73 171 100 176 Q 127 171 142 182 L 152 240 L 48 240 Z"
        fill="#06b6d4"
        opacity="0.85"
      />

      {/* Pixie cut with colored tips */}
      <ellipse cx="100" cy="68" rx="66" ry="50" fill="url(#rileyHair)" />

      {/* Side bangs */}
      <path d="M 40 75 Q 50 65 55 80" fill="#4A3B5C" />
      <path d="M 160 75 Q 150 65 145 80" fill="#06b6d4" opacity="0.8" />

      {/* Colorful highlights */}
      <path d="M 90 55 Q 95 50 100 55" fill="#06b6d4" opacity="0.6" />
      <path d="M 105 55 Q 110 50 115 55" fill="#ec4899" opacity="0.5" />

      {/* Face */}
      <ellipse cx="100" cy="105" rx="49" ry="54" fill="url(#rileySkin)" />

      {/* Ears with piercings */}
      <ellipse cx="53" cy="105" rx="7" ry="11" fill="#F0CDB8" />
      <ellipse cx="147" cy="105" rx="7" ry="11" fill="#F0CDB8" />
      <circle cx="53" cy="108" r="2.5" fill="#06b6d4" />
      <circle cx="53" cy="115" r="2" fill="#ec4899" />
      <circle cx="147" cy="108" r="2.5" fill="#06b6d4" />
      <circle cx="147" cy="115" r="2" fill="#ec4899" />

      {/* Eyes - bright and expressive */}
      <ellipse cx="80" cy="96" rx="8" ry="10" fill="white" />
      <ellipse cx="120" cy="96" rx="8" ry="10" fill="white" />
      <circle cx="80" cy="97" r="6" fill="#06b6d4" />
      <circle cx="120" cy="97" r="6" fill="#06b6d4" />
      <circle cx="82" cy="95" r="2.5" fill="white" opacity="0.9" />
      <circle cx="122" cy="95" r="2.5" fill="white" opacity="0.9" />

      {/* Eyebrows - animated */}
      <path
        d="M 68 86 Q 80 84 92 87"
        fill="none"
        stroke="#4A3B5C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 108 87 Q 120 84 132 86"
        fill="none"
        stroke="#4A3B5C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Nose - button */}
      <path
        d="M 100 101 L 100 113"
        stroke="#E0BCA8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="100" cy="113" r="2" fill="#E0BCA8" opacity="0.6" />

      {/* Freckles */}
      <circle cx="75" cy="108" r="1" fill="#E0BCA8" opacity="0.5" />
      <circle cx="78" cy="110" r="1" fill="#E0BCA8" opacity="0.5" />
      <circle cx="122" cy="108" r="1" fill="#E0BCA8" opacity="0.5" />
      <circle cx="125" cy="110" r="1" fill="#E0BCA8" opacity="0.5" />

      {/* Rosy cheeks */}
      <ellipse cx="72" cy="115" rx="11" ry="7" fill="#FF9BAF" opacity="0.4" />
      <ellipse cx="128" cy="115" rx="11" ry="7" fill="#FF9BAF" opacity="0.4" />
    </svg>
  );
}

// Kai - Pragmatic backend engineer with undercut
function KaiAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        <linearGradient id="kaiHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3A2817" />
          <stop offset="100%" stopColor="#2A1810" />
        </linearGradient>
        <radialGradient id="kaiSkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#D4A985" />
          <stop offset="100%" stopColor="#B88F6E" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#eab308" opacity="0.15" />

      {/* Neck */}
      <ellipse cx="100" cy="160" rx="27" ry="37" fill="url(#kaiSkin)" />

      {/* Shoulders/Hoodie */}
      <path
        d="M 48 186 Q 64 174 100 178 Q 136 174 152 186 L 162 240 L 38 240 Z"
        fill="#eab308"
        opacity="0.9"
      />
      <path d="M 85 178 L 95 190" stroke="#3A2817" strokeWidth="2" />
      <path d="M 115 178 L 105 190" stroke="#3A2817" strokeWidth="2" />

      {/* Undercut hairstyle - shaved sides */}
      <path d="M 38 90 L 42 100 Q 45 105 50 108" fill="#2A1810" opacity="0.3" />
      <path
        d="M 162 90 L 158 100 Q 155 105 150 108"
        fill="#2A1810"
        opacity="0.3"
      />

      {/* Top hair - messy */}
      <ellipse cx="100" cy="60" rx="60" ry="38" fill="url(#kaiHair)" />
      <path
        d="M 80 50 Q 85 40 90 48"
        fill="none"
        stroke="#2A1810"
        strokeWidth="2.5"
      />
      <path
        d="M 95 45 Q 100 35 105 45"
        fill="none"
        stroke="#2A1810"
        strokeWidth="2.5"
      />
      <path
        d="M 110 50 Q 115 40 120 48"
        fill="none"
        stroke="#2A1810"
        strokeWidth="2.5"
      />

      {/* Face - warm tone */}
      <ellipse cx="100" cy="105" rx="51" ry="57" fill="url(#kaiSkin)" />

      {/* Ears */}
      <ellipse cx="51" cy="105" rx="8" ry="13" fill="#B88F6E" />
      <ellipse cx="149" cy="105" rx="8" ry="13" fill="#B88F6E" />

      {/* Eyes - focused dark brown */}
      <ellipse cx="78" cy="95" rx="8" ry="10" fill="white" />
      <ellipse cx="122" cy="95" rx="8" ry="10" fill="white" />
      <circle cx="78" cy="96" r="6" fill="#2A1810" />
      <circle cx="122" cy="96" r="6" fill="#2A1810" />
      <circle cx="80" cy="94" r="2.5" fill="white" opacity="0.9" />
      <circle cx="124" cy="94" r="2.5" fill="white" opacity="0.9" />

      {/* Eyebrows - straight, serious */}
      <path
        d="M 66 84 Q 78 82 90 83"
        fill="none"
        stroke="#2A1810"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 110 83 Q 122 82 134 84"
        fill="none"
        stroke="#2A1810"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Nose - defined */}
      <path
        d="M 100 99 L 100 117"
        stroke="#A87E5E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 94 115 Q 100 119 106 115"
        fill="none"
        stroke="#A87E5E"
        strokeWidth="2"
      />

      {/* Light stubble */}
      <ellipse
        cx="100"
        cy="132"
        rx="30"
        ry="20"
        fill="#2A1810"
        opacity="0.15"
      />
    </svg>
  );
}

// Nova - Methodical DevOps engineer with short practical hair
function NovaAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        <linearGradient id="novaHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
        <radialGradient id="novaSkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#E8D5C8" />
          <stop offset="100%" stopColor="#D0BDB0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#64748b" opacity="0.15" />

      {/* Neck */}
      <ellipse cx="100" cy="160" rx="24" ry="35" fill="url(#novaSkin)" />

      {/* Shoulders/Utility vest */}
      <path
        d="M 54 183 Q 70 172 100 176 Q 130 172 146 183 L 156 240 L 44 240 Z"
        fill="#4B5563"
      />
      <rect
        x="92"
        y="176"
        width="16"
        height="64"
        fill="#64748b"
        opacity="0.4"
      />

      {/* Short practical bob */}
      <ellipse cx="100" cy="68" rx="64" ry="48" fill="url(#novaHair)" />

      {/* Side hair */}
      <path d="M 38 95 Q 42 120 50 140" fill="#6B7280" />
      <path d="M 162 95 Q 158 120 150 140" fill="#6B7280" />

      {/* Face */}
      <ellipse cx="100" cy="106" rx="48" ry="55" fill="url(#novaSkin)" />

      {/* Ears */}
      <ellipse cx="54" cy="106" rx="7" ry="11" fill="#D0BDB0" />
      <ellipse cx="146" cy="106" rx="7" ry="11" fill="#D0BDB0" />

      {/* Eyes - sharp and attentive */}
      <ellipse cx="78" cy="96" rx="7" ry="9" fill="white" />
      <ellipse cx="122" cy="96" rx="7" ry="9" fill="white" />
      <circle cx="78" cy="97" r="5" fill="#4B5563" />
      <circle cx="122" cy="97" r="5" fill="#4B5563" />
      <circle cx="80" cy="95" r="2" fill="white" opacity="0.9" />
      <circle cx="124" cy="95" r="2" fill="white" opacity="0.9" />

      {/* Eyebrows - neat */}
      <path
        d="M 67 87 Q 78 85 89 87"
        fill="none"
        stroke="#4B5563"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 111 87 Q 122 85 133 87"
        fill="none"
        stroke="#4B5563"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Nose - straight */}
      <path
        d="M 100 100 L 100 115"
        stroke="#C0ADA0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="96" cy="115" rx="2" ry="2" fill="#C0ADA0" opacity="0.6" />
      <ellipse cx="104" cy="115" rx="2" ry="2" fill="#C0ADA0" opacity="0.6" />

      {/* Subtle expression */}
      <path
        d="M 66 107 Q 64 113 66 119"
        fill="none"
        stroke="#C0ADA0"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M 134 107 Q 136 113 134 119"
        fill="none"
        stroke="#C0ADA0"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}

// Phoenix - Security engineer with buzzcut and intense look
function PhoenixAvatar() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full">
      <defs>
        <linearGradient id="phoenixHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <radialGradient id="phoenixSkin" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#D9B8A3" />
          <stop offset="100%" stopColor="#C0A090" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="#dc2626" opacity="0.15" />

      {/* Neck - muscular */}
      <ellipse cx="100" cy="160" rx="29" ry="38" fill="url(#phoenixSkin)" />

      {/* Shoulders/Tactical shirt */}
      <path
        d="M 46 187 Q 62 175 100 179 Q 138 175 154 187 L 164 240 L 36 240 Z"
        fill="#1a1a1a"
      />
      <path d="M 90 179 L 85 195" stroke="#dc2626" strokeWidth="1.5" />
      <path d="M 110 179 L 115 195" stroke="#dc2626" strokeWidth="1.5" />

      {/* Buzzcut */}
      <ellipse cx="100" cy="64" rx="61" ry="36" fill="url(#phoenixHair)" />

      {/* Face - angular */}
      <path
        d="M 50 96 Q 48 112 53 132 L 58 147 Q 78 162 100 162 Q 122 162 142 147 L 147 132 Q 152 112 150 96 Q 147 76 100 76 Q 53 76 50 96"
        fill="url(#phoenixSkin)"
      />

      {/* Ears */}
      <ellipse cx="50" cy="106" rx="8" ry="13" fill="#C0A090" />
      <ellipse cx="150" cy="106" rx="8" ry="13" fill="#C0A090" />

      {/* Scar over left eye */}
      <path
        d="M 70 88 L 82 102"
        stroke="#B09080"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Eyes - intense dark */}
      <ellipse cx="76" cy="96" rx="7" ry="9" fill="white" />
      <ellipse cx="124" cy="96" rx="7" ry="9" fill="white" />
      <circle cx="76" cy="97" r="5.5" fill="#0a0a0a" />
      <circle cx="124" cy="97" r="5.5" fill="#0a0a0a" />
      <circle cx="78" cy="95" r="2" fill="white" opacity="0.8" />
      <circle cx="126" cy="95" r="2" fill="white" opacity="0.8" />

      {/* Eyebrows - intense furrowed */}
      <path
        d="M 64 84 Q 76 80 88 83"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 112 83 Q 124 80 136 84"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Nose - strong */}
      <path
        d="M 100 99 L 100 119"
        stroke="#B09080"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 93 117 Q 100 122 107 117"
        fill="none"
        stroke="#B09080"
        strokeWidth="2.5"
      />

      {/* Goatee */}
      <ellipse cx="100" cy="145" rx="14" ry="12" fill="#0a0a0a" opacity="0.5" />
      <path d="M 90 135 Q 100 140 110 135" fill="#0a0a0a" opacity="0.3" />

      {/* Strong jawline */}
      <path
        d="M 58 133 Q 63 143 73 148"
        fill="none"
        stroke="#B09080"
        strokeWidth="2"
        opacity="0.5"
      />
      <path
        d="M 142 133 Q 137 143 127 148"
        fill="none"
        stroke="#B09080"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  );
}

// Pure SVG avatar generator - now with unique, realistic designs
function generateSVGAvatar(interviewer: InterviewerConfig) {
  switch (interviewer.id) {
    case "alex":
      return <AlexAvatar />;
    case "morgan":
      return <MorganAvatar />;
    case "jordan":
      return <JordanAvatar />;
    case "sam":
      return <SamAvatar />;
    case "riley":
      return <RileyAvatar />;
    case "kai":
      return <KaiAvatar />;
    case "nova":
      return <NovaAvatar />;
    case "phoenix":
      return <PhoenixAvatar />;
    default:
      return <AlexAvatar />;
  }
}

export function Avatar2D({
  interviewer,
  mouthShape,
  isSpeaking,
}: Avatar2DProps) {
  console.log(
    "[Avatar2D] Rendering:",
    interviewer.name,
    "mouthShape:",
    mouthShape,
    "isSpeaking:",
    isSpeaking
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Avatar base */}
      <div className="relative w-56 h-56 rounded-full overflow-hidden ring-4 ring-white/10 bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Pure SVG Avatar */}
        {generateSVGAvatar(interviewer)}

        {/* Animated mouth overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 200 240"
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            className={`transition-all duration-75 ${
              isSpeaking ? "opacity-100" : "opacity-90"
            }`}
          >
            {MOUTH_SHAPES[mouthShape]}
          </g>
        </svg>

        {/* Speaking pulse animation */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full ring-4 ring-blue-400/50 animate-pulse" />
        )}
      </div>

      {/* Sound waves animation when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 rounded-full border-2 border-blue-400/30 animate-ping"
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: "1.5s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
