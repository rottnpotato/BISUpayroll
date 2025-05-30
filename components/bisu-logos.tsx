import React from "react";

export const BisuSealSvg: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = "",
  width = 100,
  height = 100
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="95" fill="#46246C" stroke="#F6CC1A" strokeWidth="5" />
      <circle cx="100" cy="100" r="85" fill="#46246C" stroke="#F6CC1A" strokeWidth="2" />
      <path
        d="M40,100 A60,60 0 1,1 160,100 A60,60 0 1,1 40,100 Z"
        fill="none"
        stroke="#F6CC1A"
        strokeWidth="2"
      />
      <text
        x="100"
        y="65"
        textAnchor="middle"
        fill="#F6CC1A"
        fontSize="12"
        fontWeight="bold"
      >
        BOHOL ISLAND
      </text>
      <text
        x="100"
        y="80"
        textAnchor="middle"
        fill="#F6CC1A"
        fontSize="12"
        fontWeight="bold"
      >
        STATE UNIVERSITY
      </text>
      <text
        x="100"
        y="140"
        textAnchor="middle"
        fill="#F6CC1A"
        fontSize="10"
      >
        BALILIHAN CAMPUS
      </text>
      <text
        x="100"
        y="160"
        textAnchor="middle"
        fill="#F6CC1A"
        fontSize="8"
      >
        ESTABLISHED 2009
      </text>
      <path
        d="M100,30 L100,55"
        stroke="#F6CC1A"
        strokeWidth="1"
      />
      <path
        d="M100,145 L100,170"
        stroke="#F6CC1A"
        strokeWidth="1"
      />
      <path
        d="M30,100 L55,100"
        stroke="#F6CC1A"
        strokeWidth="1"
      />
      <path
        d="M145,100 L170,100"
        stroke="#F6CC1A"
        strokeWidth="1"
      />
      
      {/* Simplified map of Bohol */}
      <path
        d="M85,95 C85,90 90,85 100,85 C110,85 115,90 115,95 C115,105 105,115 100,115 C95,115 85,105 85,95 Z"
        fill="#00AA55"
        stroke="#F6CC1A"
        strokeWidth="1"
      />
      
      {/* Book symbol */}
      <path
        d="M90,100 L90,110 L110,110 L110,100 C110,100 105,95 100,95 C95,95 90,100 90,100 Z"
        fill="#FFFFFF"
        stroke="#F6CC1A"
        strokeWidth="1"
      />
      <path
        d="M100,95 L100,110"
        stroke="#F6CC1A"
        strokeWidth="1"
      />
    </svg>
  );
};

export const BagongPilipinasSvg: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = "",
  width = 120,
  height = 60
}) => {
  return (
    <svg
      viewBox="0 0 240 120"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun */}
      <circle cx="120" cy="60" r="25" fill="#FCD116" />
      
      {/* Sun rays */}
      {[...Array(8)].map((_, i) => (
        <path
          key={i}
          d={`M120,60 L${120 + 35 * Math.cos(i * Math.PI / 4)},${60 + 35 * Math.sin(i * Math.PI / 4)}`}
          stroke="#FCD116"
          strokeWidth="4"
        />
      ))}
      
      {/* Three stars */}
      <polygon
        points="70,40 75,50 85,50 77,57 80,67 70,62 60,67 63,57 55,50 65,50"
        fill="#FCD116"
      />
      <polygon
        points="170,40 175,50 185,50 177,57 180,67 170,62 160,67 163,57 155,50 165,50"
        fill="#FCD116"
      />
      <polygon
        points="120,90 125,100 135,100 127,107 130,117 120,112 110,117 113,107 105,100 115,100"
        fill="#FCD116"
      />
      
      {/* Stylized Philippine flag colors */}
      <path
        d="M50,30 L50,90 C70,85 90,85 110,90 C130,95 150,95 170,90 L170,30 C150,35 130,35 110,30 C90,25 70,25 50,30 Z"
        fill="#0038A8"
        opacity="0.7"
      />
      <path
        d="M170,30 L170,90 C190,85 210,85 230,90 L230,30 C210,35 190,35 170,30 Z"
        fill="#CE1126"
        opacity="0.7"
      />
      <path
        d="M10,30 L10,90 C30,85 50,85 70,90 L70,30 C50,35 30,35 10,30 Z"
        fill="#CE1126"
        opacity="0.7"
      />
      
      {/* Text */}
      <text
        x="120"
        y="15"
        textAnchor="middle"
        fill="#FCD116"
        fontSize="12"
        fontWeight="bold"
      >
        BAGONG PILIPINAS
      </text>
    </svg>
  );
};

export const TuvRheinlandSvg: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = "",
  width = 120,
  height = 60
}) => {
  return (
    <svg
      viewBox="0 0 240 120"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* TÜV Blue Border */}
      <rect x="20" y="20" width="200" height="80" rx="5" fill="#FFFFFF" stroke="#0066B3" strokeWidth="2" />
      
      {/* TÜV Blue Logo */}
      <path
        d="M50,40 L190,40 L120,90 Z"
        fill="#0066B3"
      />
      
      {/* Management System Text */}
      <text
        x="120"
        y="35"
        textAnchor="middle"
        fill="#000000"
        fontSize="8"
      >
        Management System
      </text>
      
      {/* ISO Text */}
      <text
        x="180"
        y="60"
        textAnchor="middle"
        fill="#000000"
        fontSize="8"
        fontWeight="bold"
      >
        ISO 9001:2015
      </text>
      
      {/* CERTIFIED Text */}
      <text
        x="120"
        y="60"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="10"
        fontWeight="bold"
      >
        CERTIFIED
      </text>
      
      {/* TÜV Rheinland */}
      <text
        x="120"
        y="105"
        textAnchor="middle"
        fill="#0066B3"
        fontSize="8"
        fontWeight="bold"
      >
        TÜV RHEINLAND
      </text>
    </svg>
  );
}; 