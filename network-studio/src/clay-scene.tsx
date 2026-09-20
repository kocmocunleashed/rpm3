import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  ContactShadows,
  Html,
  Line,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

type Point = [number, number, number];
type Medium = "copper" | "fiber" | "radio";
export type LanState = {
  serverPosition: number;
  clientPositions: [number, number];
  joined: boolean;
};
export type ClaySceneProps = {
  kind: "journey" | "router" | "media" | "scale";
  motion: boolean;
  stage?: number;
  explode?: number;
  selectedPart?: number;
  medium?: Medium;
  scope?: number;
  onSelect?: (part: number) => void;
  running?: boolean;
  matchState?: LanState;
};
const colors = {
  mint: "#b5d6c8",
  peach: "#efbb9d",
  cream: "#fff3d6",
  blue: "#aecce0",
  lilac: "#c7b8d9",
  dark: "#566b67",
  green: "#719f87",
};

function Block({
  size,
  at = [0, 0, 0],
  color = colors.cream,
  rounding = 0.1,
  rotate = [0, 0, 0],
}: {
  size: Point;
  at?: Point;
  color?: string;
  rounding?: number;
  rotate?: Point;
}) {
  return (
    <RoundedBox
      args={size}
      position={at}
      rotation={rotate}
      radius={Math.min(rounding, ...size.map((n) => n * 0.49))}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        roughness={0.82}
        clearcoat={0.06}
        clearcoatRoughness={0.9}
      />
    </RoundedBox>
  );
}
function Ball({
  at,
  size = 0.075,
  color = colors.peach,
}: {
  at: Point;
  size?: number;
  color?: string;
}) {
  return (
    <mesh position={at} castShadow>
      <sphereGeometry args={[size, 20, 14]} />
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
  );
}
function Stem({
  at,
  length,
  color = colors.cream,
  radius = 0.055,
  rotate = [0, 0, 0],
}: {
  at: Point;
  length: number;
  color?: string;
  radius?: number;
  rotate?: Point;
}) {
  return (
    <mesh position={at} rotation={rotate} castShadow>
      <capsuleGeometry args={[radius, length, 5, 12]} />
      <meshStandardMaterial color={color} roughness={0.87} />
    </mesh>
  );
}
function Tube({
  curve,
  width = 0.045,
  color = colors.cream,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  width?: number;
  color?: string;
}) {
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 72, width, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  );
}
function Label({
  at,
  children,
  active = false,
}: {
  at: Point;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Html
      position={at}
      center
      style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: "inherit",
          fontWeight: 650,
          fontSize: 11,
          letterSpacing: ".015em",
          color: active ? "#425f50" : "#6f7d74",
          background: active ? "#e2edcf" : "#fffdf1e6",
          border: "1px solid #ffffffa6",
          borderRadius: 30,
          padding: "6px 11px",
          boxShadow: "0 3px 9px #5c68500b",
        }}
      >
        {children}
      </span>
    </Html>
  );
}
function Platform({
  at = [0, -0.7, 0],
  size = [2, 0.17, 1.7],
  color = colors.cream,
  active = false,
}: {
  at?: Point;
  size?: Point;
  color?: string;
  active?: boolean;
}) {
  return (
    <group position={at}>
      <Block size={size} color={color} rounding={0.23} />
      {active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
          <ringGeometry
            args={[
              Math.max(size[0], size[2]) * 0.61,
              Math.max(size[0], size[2]) * 0.64,
              60,
            ]}
          />
          <meshBasicMaterial
            color="#e2b185"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
function Laptop({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <Block
        size={[1.48, 0.115, 1]}
        at={[0, -0.5, 0.13]}
        color={colors.lilac}
        rounding={0.09}
      />
      <Block
        size={[0.93, 0.013, 0.41]}
        at={[0, -0.437, 0.06]}
        color="#aa99bc"
        rounding={0.03}
      />
      {[-0.095, 0.035, 0.165].map((z) => (
        <Line
          key={z}
          points={[
            [-0.4, -0.426, z],
            [0.4, -0.426, z],
          ]}
          color="#d8cee5"
          lineWidth={1.8}
        />
      ))}
      <Block
        size={[0.34, 0.01, 0.16]}
        at={[0, -0.435, 0.43]}
        color="#e2d8ed"
        rounding={0.025}
      />
      <group position={[0, 0.075, -0.35]} rotation={[-0.13, 0, 0]}>
        <Block size={[1.48, 1.05, 0.12]} color={colors.lilac} rounding={0.09} />
        <Block
          size={[1.27, 0.82, 0.018]}
          at={[0, 0.01, 0.073]}
          color="#fcf9e8"
          rounding={0.045}
        />
        <Block
          size={[0.57, 0.35, 0.01]}
          at={[-0.1, 0.04, 0.087]}
          color={colors.mint}
          rounding={0.045}
        />
        <Line
          points={[
            [-0.35, 0.17, 0.096],
            [-0.1, -0.025, 0.096],
            [0.15, 0.17, 0.096],
          ]}
          color="#f9f8e6"
          lineWidth={2.2}
        />
        <Ball at={[0.44, -0.24, 0.09]} size={0.043} color={colors.peach} />
      </group>
    </group>
  );
}
function AccessPoint({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <Block
        size={[1.44, 0.4, 0.98]}
        at={[0, -0.39, 0]}
        color={colors.cream}
        rounding={0.18}
      />
      <Block
        size={[1.18, 0.05, 0.72]}
        at={[0, -0.6, 0]}
        color={colors.peach}
        rounding={0.04}
      />
      {[-0.5, 0.5].map((x) => (
        <Stem
          key={x}
          at={[x, 0.16, -0.32]}
          length={0.78}
          color={colors.peach}
          rotate={[0, 0, -x * 0.12]}
        />
      ))}
      {[-0.38, -0.19, 0].map((x) => (
        <Ball key={x} at={[x, -0.39, 0.492]} size={0.03} color={colors.green} />
      ))}
      <Block
        size={[0.24, 0.07, 0.015]}
        at={[0.38, -0.39, 0.5]}
        color={colors.peach}
        rounding={0.02}
      />
    </group>
  );
}
function Server({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <Block
        size={[1.1, 1.9, 1]}
        at={[0, 0.31, 0]}
        color={colors.blue}
        rounding={0.14}
      />
      {[-0.29, 0.23, 0.75].map((y) => (
        <group key={y} position={[0, y, 0.51]}>
          <Block
            size={[0.89, 0.39, 0.04]}
            color={colors.cream}
            rounding={0.06}
          />
          <Ball at={[-0.3, 0, 0.035]} size={0.034} color={colors.green} />
          <Block
            size={[0.37, 0.035, 0.015]}
            at={[0.12, 0.07, 0.031]}
            color="#b7cbd3"
            rounding={0.01}
          />
          <Block
            size={[0.37, 0.035, 0.015]}
            at={[0.12, -0.07, 0.031]}
            color="#b7cbd3"
            rounding={0.01}
          />
        </group>
      ))}
    </group>
  );
}
function Cloud() {
  return (
    <group scale={[1, 0.87, 0.65]}>
      <Block
        size={[1.72, 0.5, 0.8]}
        at={[0, -0.08, 0]}
        color={colors.cream}
        rounding={0.24}
      />
      <Ball at={[-0.43, 0.15, 0]} size={0.39} color={colors.cream} />
      <Ball at={[0.13, 0.27, 0]} size={0.53} color={colors.cream} />
      <Ball at={[0.57, 0.06, 0]} size={0.33} color={colors.cream} />
    </group>
  );
}
function Pulse({
  curve,
  reverse = false,
  motion,
  offset = 0,
  color = colors.peach,
  once = false,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  reverse?: boolean;
  motion: boolean;
  offset?: number;
  color?: string;
  once?: boolean;
}) {
  const node = useRef<THREE.Mesh>(null);
  const progress = useRef(motion ? offset : once ? 1 : offset);
  const previousTime = useRef<number | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  // A pause changes only the clock baseline. It never teleports or resets data.
  useEffect(() => {
    previousTime.current = null;
    invalidate();
  }, [motion, invalidate]);
  useFrame(({ clock }) => {
    if (!node.current) return;
    if (motion) {
      const elapsed =
        previousTime.current === null
          ? 0
          : clock.elapsedTime - previousTime.current;
      progress.current = once
        ? Math.min(progress.current + elapsed / 1.65, 1)
        : (progress.current + elapsed * 0.33) % 1;
    }
    previousTime.current = clock.elapsedTime;
    node.current.position.copy(
      curve.getPoint(reverse ? 1 - progress.current : progress.current),
    );
  });
  return (
    <mesh ref={node} castShadow>
      <sphereGeometry args={[0.105, 18, 12]} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function ScreenInk({ kind, state }: { kind: "music" | "game"; state: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = kind === "music" ? 568 : 200;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = kind === "music" ? "#173d2d" : "#263b3a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "middle";
    if (kind === "music") {
      ctx.fillStyle = "#f4faef";
      ctx.font = "bold 35px Arial";
      ctx.fillText("Spotify", 29, 43);
      ctx.fillStyle = "#b9d6ad";
      ctx.font = "18px Arial";
      ctx.fillText("СУРГАЛТЫН ЖИШЭЭ", 29, 79);
      ctx.fillStyle = "#ddc797";
      ctx.fillRect(29, 115, 262, 232);
      ctx.fillStyle = "#eeab86";
      ctx.beginPath();
      ctx.arc(182, 233, 96, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#355c45";
      ctx.beginPath();
      ctx.arc(134, 232, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a6cfa1";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(134, 232, 49, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff3d6";
      ctx.beginPath();
      ctx.arc(134, 232, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f4faef";
      ctx.font = "bold 24px Arial";
      ctx.fillText("Нэг аялгуу", 29, 379);
      ctx.fillStyle = "#b3c9b7";
      ctx.font = "18px Arial";
      ctx.fillText(
        state === 5
          ? "ТҮР ЗОГССОН"
          : state === 4
            ? "ТОГЛОЖ БАЙНА"
            : state === 3
              ? "БУФЕРЛЭЖ БАЙНА"
              : "PLAY ДАРААРАЙ",
        29,
        411,
      );
      ctx.fillStyle = "#1ed760";
      ctx.beginPath();
      ctx.arc(160, 461, 27, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#173d2d";
      if (state === 4) {
        ctx.fillRect(150, 449, 7, 24);
        ctx.fillRect(164, 449, 7, 24);
      } else {
        ctx.beginPath();
        ctx.moveTo(153, 449);
        ctx.lineTo(172, 461);
        ctx.lineTo(153, 473);
        ctx.closePath();
        ctx.fill();
      }
      const received = state >= 4 ? 4 : 0;
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i < received ? "#1ed760" : "#4d6758";
        ctx.fillRect(29 + i * 33, 512, 27, 10);
      }
      ctx.fillStyle = "#bfd1c2";
      ctx.font = "15px Arial";
      ctx.fillText("БУФЕР · ДУУ БҮТНЭЭРЭЭ ИРЭЭГҮЙ", 29, 540);
    } else {
      ctx.fillStyle = "#f1d39e";
      ctx.font = "bold 25px Arial";
      ctx.fillText("COUNTER-STRIKE", 16, 23);
      ctx.fillStyle = "#b8d5c7";
      ctx.font = "14px Arial";
      ctx.fillText(
        state < 0 ? "LOCAL SERVER · READY" : "LOCAL MATCH · SYNCED",
        16,
        48,
      );
      ctx.fillStyle = "#4b6459";
      ctx.fillRect(17, 65, 286, 118);
      ctx.fillStyle = "#91a79a";
      for (const r of [
        [42, 84, 62, 16],
        [135, 111, 16, 51],
        [206, 81, 71, 18],
        [201, 153, 55, 13],
      ])
        ctx.fillRect(r[0], r[1], r[2], r[3]);
      ctx.fillStyle = state < 0 ? "#849d90" : "#eab27c";
      ctx.beginPath();
      ctx.arc(state > 0 && state % 2 ? 180 : 114, 123, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = state < 0 ? "#849d90" : "#a8c9e0";
      ctx.beginPath();
      ctx.arc(248, 126, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [kind, state]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}
function MusicPhone({ stage, running }: { stage: number; running: boolean }) {
  return (
    <group rotation={[0, -0.1, -0.07]}>
      <Block size={[1.22, 2.24, 0.19]} color="#83b79b" rounding={0.17} />
      <mesh position={[0, 0.005, 0.105]}>
        <planeGeometry args={[1.045, 1.88]} />
        <ScreenInk kind="music" state={stage === 4 && !running ? 5 : stage} />
      </mesh>
      <Block
        size={[0.28, 0.055, 0.016]}
        at={[0, 1.025, 0.105]}
        color="#5b7a68"
        rounding={0.026}
      />
    </group>
  );
}
function GameClient({ state }: { state: number }) {
  return (
    <group>
      <Laptop />
      <group position={[0, 0.075, -0.35]} rotation={[-0.13, 0, 0]}>
        <mesh position={[0, 0.01, 0.101]}>
          <planeGeometry args={[1.22, 0.76]} />
          <ScreenInk kind="game" state={state} />
        </mesh>
      </group>
    </group>
  );
}
function Journey({
  stage,
  motion,
  running,
}: {
  stage: number;
  motion: boolean;
  running: boolean;
}) {
  const routes = useMemo(() => {
    const local = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.76, 0.02, 0.57),
      new THREE.Vector3(-2.1, 0.15, 0.77),
      new THREE.Vector3(-1.4, -0.02, 0.75),
      new THREE.Vector3(-0.9, -0.33, 0.37),
    ]);
    // The WAN route actually enters the Internet cloud. There is no direct bypass.
    const wan = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, -0.35, 0.31),
      new THREE.Vector3(0.02, 0.05, -0.05),
      new THREE.Vector3(0.83, 1.02, -0.38),
      new THREE.Vector3(1.79, 0.73, -0.29),
      new THREE.Vector3(2.8, -0.17, 0.17),
    ]);
    const full = new THREE.CurvePath<THREE.Vector3>();
    full.add(local);
    full.add(new THREE.LineCurve3(local.getPoint(1), wan.getPoint(0)));
    full.add(wan);
    return { local, wan, full };
  }, []);
  return (
    <group rotation={[0, -0.08, 0]}>
      <group position={[-3.2, 0.28, 0.12]}>
        <Platform
          at={[0, -1.2, 0]}
          size={[1.85, 0.17, 1.45]}
          color="#d9e6d5"
          active={stage >= 3}
        />
        <MusicPhone stage={stage} running={running} />
        <Label at={[0, -1.31, 0.94]} active={stage >= 3}>
          Spotify · таны утас
        </Label>
      </group>
      <group position={[-0.63, 0, 0.05]}>
        <Platform size={[1.8, 0.17, 1.55]} color="#f0dfc7" />
        <AccessPoint scale={0.9} />
        <Label at={[0, -0.83, 1.02]} active={stage === 1}>
          Гэрийн Wi-Fi
        </Label>
      </group>
      <group position={[0.87, 1.03, -0.72]} scale={0.91}>
        <Cloud />
        <Label at={[0, 0.74, 0.05]} active={stage === 2}>
          Интернэт
        </Label>
      </group>
      <group position={[3.15, 0, -0.14]}>
        <Platform size={[1.8, 0.17, 1.6]} color="#dbe7e6" />
        <Server />
        <Label at={[0, -0.84, 1.04]} active={stage >= 2}>
          Аудио / CDN
        </Label>
      </group>
      <Line
        points={routes.local.getPoints(45)}
        color={stage === 1 ? "#c59065" : "#a5ba9d"}
        lineWidth={2.1}
        dashed
        dashSize={0.1}
        gapSize={0.08}
      />
      <Tube
        curve={routes.wan}
        width={0.046}
        color={stage === 2 ? "#d9a67d" : "#b8c2ac"}
      />
      {stage === 1 && (
        <Pulse
          key="request-local"
          curve={routes.local}
          motion={motion}
          once
          color="#d49267"
        />
      )}
      {stage === 2 && (
        <Pulse
          key="request-wan"
          curve={routes.wan}
          motion={motion}
          once
          color="#d49267"
        />
      )}
      {stage === 3 && (
        <Pulse
          key="first-audio"
          curve={routes.full}
          reverse
          motion={motion}
          once
          color="#50a674"
        />
      )}
      {stage >= 4 &&
        [0, 0.28, 0.56].map((offset) => (
          <Pulse
            key={offset}
            curve={routes.full}
            reverse
            motion={motion}
            offset={offset}
            color="#50a674"
          />
        ))}
    </group>
  );
}

function Lift({
  height,
  motion,
  children,
}: {
  height: number;
  motion: boolean;
  children: ReactNode;
}) {
  const node = useRef<THREE.Group>(null),
    [initial] = useState(height);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [height, motion, invalidate]);
  useFrame((_, delta) => {
    if (!node.current) return;
    node.current.position.y = motion
      ? THREE.MathUtils.damp(
          node.current.position.y,
          height,
          9,
          Math.min(delta, 0.05),
        )
      : height;
    if (Math.abs(node.current.position.y - height) > 0.001) invalidate();
  });
  return (
    <group ref={node} position={[0, initial, 0]}>
      {children}
    </group>
  );
}
function RouterModel({
  explode,
  selectedPart,
  motion,
  onSelect,
}: {
  explode: number;
  selectedPart: number;
  motion: boolean;
  onSelect?: (part: number) => void;
}) {
  const select = (part: number) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect?.(part);
  };
  const selected = (part: number, fallback: string) =>
    selectedPart === part ? "#dba07f" : fallback;
  return (
    <group position={[0, -0.2, 0]} rotation={[0, -0.27, 0]}>
      <Lift height={-0.01 + explode * 1.85} motion={motion}>
        <Block size={[3.5, 0.52, 2.25]} color={colors.cream} rounding={0.22} />
        <group position={[0, 0.27, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
          {[0.14, 0.25, 0.36].map((radius) => (
            <Line
              key={radius}
              points={Array.from({ length: 24 }, (_, i) => {
                const a = 0.22 * Math.PI + (i / 23) * 0.56 * Math.PI;
                return [
                  Math.cos(a) * radius,
                  Math.sin(a) * radius - 0.13,
                  0,
                ] as Point;
              })}
              color="#bac8ab"
              lineWidth={2.3}
            />
          ))}
        </group>
        {[-1, 1].map((side) =>
          Array.from({ length: 6 }, (_, i) => (
            <Block
              key={`${side}-${i}`}
              size={[0.045, 0.013, 0.63]}
              at={[side * (0.72 + i * 0.13), 0.264, -0.05]}
              color="#d9d7c4"
              rounding={0.005}
            />
          )),
        )}
      </Lift>
      <Lift height={-0.25 + explode * 0.71} motion={motion}>
        <Block size={[3.15, 0.055, 1.94]} color="#91b99e" rounding={0.027} />
        {[-0.69, -0.47, 0.47, 0.69].map((z) => (
          <Line
            key={z}
            points={[
              [-1.4, 0.032, z],
              [-0.8, 0.032, z],
              [-0.6, 0.032, z * 0.5],
              [0.98, 0.032, z * 0.5],
              [1.36, 0.032, z],
            ]}
            color="#d1dda6"
            lineWidth={1.8}
          />
        ))}
        <group position={[-0.47, 0.11, 0]} onClick={select(0)}>
          <Block
            size={[0.84, 0.18, 0.81]}
            color={selected(0, colors.lilac)}
            rounding={0.055}
          />
          {[-0.29, -0.145, 0, 0.145, 0.29].map((x) => (
            <Block
              key={x}
              size={[0.08, 0.14, 0.61]}
              at={[x, 0.135, 0]}
              color={selected(0, "#e0d4ea")}
              rounding={0.032}
            />
          ))}
          {[-1, 1].map((side) =>
            Array.from({ length: 6 }, (_, i) => (
              <Block
                key={`${side}-${i}`}
                size={[0.085, 0.029, 0.041]}
                at={[side * 0.45, -0.035, -0.26 + i * 0.104]}
                color="#eed19d"
                rounding={0.008}
              />
            )),
          )}
        </group>
        <group position={[0.73, 0.09, 0]} onClick={select(1)}>
          {[-0.46, 0, 0.46].map((z) => (
            <Block
              key={z}
              size={[0.62, 0.13, 0.3]}
              at={[0, 0, z]}
              color={selected(1, "#bec5d8")}
              rounding={0.035}
            />
          ))}
          {[-0.23, -0.115, 0, 0.115, 0.23].map((x) => (
            <Block
              key={x}
              size={[0.038, 0.024, 1.3]}
              at={[x, -0.064, 0]}
              color="#e8d1a0"
              rounding={0.007}
            />
          ))}
        </group>
        <group onClick={select(3)}>
          <Block
            size={[0.37, 0.11, 0.41]}
            at={[-1.2, 0.08, -0.61]}
            color={selected(3, "#bed1c4")}
            rounding={0.04}
          />
        </group>
      </Lift>
      <Block
        size={[3.5, 0.66, 2.25]}
        at={[0, -0.6, 0]}
        color={colors.mint}
        rounding={0.2}
      />
      {[-1.33, 1.33].map((x) =>
        [-0.8, 0.8].map((z) => (
          <Block
            key={`${x}-${z}`}
            size={[0.29, 0.12, 0.29]}
            at={[x, -0.96, z]}
            color="#97a99f"
            rounding={0.05}
          />
        )),
      )}
      <group onClick={select(2)}>
        {[-1.18, -0.59, 0, 0.59, 1.18].map((x, i) => (
          <group key={x} position={[x, -0.61, 1.127]}>
            <Block
              size={[0.46, 0.31, 0.09]}
              color={selected(2, i === 4 ? colors.peach : colors.cream)}
              rounding={0.04}
            />
            <Block
              size={[0.34, 0.19, 0.015]}
              at={[0, 0, 0.053]}
              color="#68766e"
              rounding={0.018}
            />
            <Block
              size={[0.25, 0.048, 0.012]}
              at={[0, 0.055, 0.064]}
              color="#eacf99"
              rounding={0.008}
            />
          </group>
        ))}
      </group>
      <group onClick={select(3)}>
        {[-1.46, 1.46].map((x) => (
          <group key={x} position={[x, -0.35, -0.91]}>
            <Ball
              at={[0, 0, 0]}
              size={0.13}
              color={selected(3, colors.cream)}
            />
            <Stem
              at={[0, 0.88, 0]}
              length={1.66}
              radius={0.074}
              color={selected(3, colors.cream)}
              rotate={[0, 0, x * -0.07]}
            />
          </group>
        ))}
      </group>
      {explode > 0.15 &&
        [-1.3, 1.3].map((x) => (
          <Line
            key={x}
            points={[
              [x, -0.3, -0.72],
              [x, -0.2 + explode * 1.85, -0.72],
            ]}
            color="#a8b6a3"
            transparent
            opacity={0.6}
            dashed
            dashSize={0.035}
            gapSize={0.065}
            lineWidth={1}
          />
        ))}
    </group>
  );
}

function copperCurve(pair: number, strand: number, spread: number) {
  return new THREE.CatmullRomCurve3(
    Array.from({ length: 121 }, (_, i) => {
      const t = i / 120,
        fan = THREE.MathUtils.smoothstep(t, 0.28, 0.88),
        phase = t * Math.PI * 13 + strand * Math.PI;
      return new THREE.Vector3(
        -2.7 + t * 5.25,
        (pair - 1.5) * (0.18 + fan * spread * 0.39) + Math.sin(phase) * 0.067,
        Math.cos(phase) * 0.067,
      );
    }),
  );
}
function Copper({ explode, motion }: { explode: number; motion: boolean }) {
  const wires = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) =>
        copperCurve(Math.floor(i / 2), i % 2, explode),
      ),
    [explode],
  );
  return (
    <group rotation={[0, 0, -0.06]}>
      <mesh position={[-1.98, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.49, 0.49, 1.65, 40, 1, true]} />
        <meshStandardMaterial
          color={colors.lilac}
          roughness={0.86}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-1.145, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.455, 0.038, 8, 40]} />
        <meshStandardMaterial color="#e1d6e9" roughness={0.8} />
      </mesh>
      {wires.map((curve, i) => (
        <Tube
          key={i}
          curve={curve}
          width={0.043}
          color={
            i % 2
              ? "#fff5db"
              : ["#dda078", "#91b795", "#9cbcd5", "#bda38c"][Math.floor(i / 2)]
          }
        />
      ))}
      {wires
        .filter((_, i) => i % 2 === 0)
        .map((curve, i) => (
          <Pulse
            key={i}
            curve={curve}
            motion={motion}
            offset={i * 0.22}
            color="#eec18c"
          />
        ))}
      <Label at={[-1.95, -0.8, 0.45]}>Гадна бүрээс</Label>
      <Label at={[1.33, -1.2, 0.4]}>4 мушгиа хос · 8 утас</Label>
    </group>
  );
}
function Fiber({
  explode,
  motion,
  signal,
}: {
  explode: number;
  motion: boolean;
  signal: boolean;
}) {
  const path = useMemo(
    () =>
      new THREE.LineCurve3(
        new THREE.Vector3(-2.6, 0, 0),
        new THREE.Vector3(2.8, 0, 0),
      ),
    [],
  );
  return (
    <group rotation={[0, 0, -0.08]} position={[0, -0.25, 0]}>
      <Lift height={0} motion={motion}>
        <mesh
          position={[-1.42, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.55, 0.55, 2.6, 48, 1, true]} />
          <meshStandardMaterial
            color={colors.peach}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[-0.11, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.517, 0.033, 10, 48]} />
          <meshStandardMaterial color="#f8dec4" roughness={0.9} />
        </mesh>
        <Label at={[-1.8, -0.83, 0.3]}>Бүрээс</Label>
      </Lift>
      <Lift height={explode * 0.65} motion={motion}>
        <mesh
          position={[-0.35, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.31, 0.31, 3.7, 48, 1, true]} />
          <meshStandardMaterial
            color={colors.blue}
            roughness={0.72}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[1.505, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.286, 0.025, 8, 40]} />
          <meshStandardMaterial color="#d9e8e9" roughness={0.8} />
        </mesh>
        <Label at={[0.49, -0.61, 0.2]}>Шилэн хучилт</Label>
      </Lift>
      <Lift height={explode * 1.35} motion={motion}>
        <Tube curve={path} width={0.095} color="#e3d49a" />
        <Pulse curve={path} motion={motion && signal} color="#fff7b7" />
        <Pulse
          curve={path}
          motion={motion && signal}
          offset={0.5}
          color="#fff7b7"
        />
        <Label at={[2.2, 0.38, 0.1]}>Гэрэл дамжих гол</Label>
      </Lift>
    </group>
  );
}
function Phone({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale} rotation={[0, -0.12, -0.07]}>
      <Block size={[0.92, 1.66, 0.14]} color={colors.blue} rounding={0.13} />
      <Block
        size={[0.76, 1.34, 0.018]}
        at={[0, 0.01, 0.084]}
        color="#faf6e4"
        rounding={0.075}
      />
      <Block
        size={[0.24, 0.05, 0.016]}
        at={[0, 0.713, 0.084]}
        color="#aac1cf"
        rounding={0.02}
      />
      {[-0.3, 0, 0.3].map((y, i) => (
        <Block
          key={y}
          size={[0.43, 0.13, 0.015]}
          at={[0, y, 0.105]}
          color={i === 0 ? colors.peach : colors.mint}
          rounding={0.05}
        />
      ))}
    </group>
  );
}
function ArrowTip({
  curve,
  color,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  color: string;
}) {
  const point = curve.getPoint(0.82),
    tangent = curve.getTangent(0.82).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    tangent,
  );
  return (
    <mesh position={point} quaternion={quaternion}>
      <coneGeometry args={[0.075, 0.22, 3]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
function Radio({ motion, stage }: { motion: boolean; stage: number }) {
  const paths = useMemo(
    () => [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.93, 0.22, 0.18),
        new THREE.Vector3(0.25, 0.73, 0.18),
        new THREE.Vector3(-1.59, 0.1, 0.18),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.48, -0.3, 0.25),
        new THREE.Vector3(0.2, -0.62, 0.38),
        new THREE.Vector3(1.99, -0.26, 0.2),
      ]),
    ],
    [],
  );
  const leg = stage > 0 ? (stage - 1) % 2 : -1;
  return (
    <group>
      <group position={[-2.2, 0, 0]}>
        <Platform size={[2, 0.16, 1.65]} color="#eedcc6" active={leg === 0} />
        <AccessPoint />
        <Label at={[0, -0.9, 1.05]} active={leg === 0}>
          Хандалтын цэг
        </Label>
      </group>
      <group position={[2.4, 0.3, 0]}>
        <Platform
          at={[0, -0.98, 0]}
          size={[1.55, 0.16, 1.4]}
          color="#dbe8e9"
          active={leg === 1}
        />
        <Phone />
        <Label at={[0, -1.2, 1.05]} active={leg === 1}>
          Төхөөрөмж
        </Label>
      </group>
      {paths.map((path, i) => (
        <group key={i}>
          <Line
            points={path.getPoints(45)}
            color={i === 0 ? "#ceaa8c" : "#90b39d"}
            lineWidth={leg === i ? 3.4 : 1.8}
            transparent
            opacity={leg === i ? 1 : 0.48}
          />
          <ArrowTip curve={path} color={i === 0 ? "#b88a67" : "#78a187"} />
        </group>
      ))}
      <Label at={[0, 0.92, 0.2]} active={leg === 0}>
        Хүсэлт
      </Label>
      <Label at={[0, -0.93, 0.3]} active={leg === 1}>
        Хариу
      </Label>
      {leg >= 0 && (
        <Pulse
          key={stage}
          curve={paths[leg]}
          motion={motion}
          once
          color={leg === 0 ? "#d6a278" : "#74a486"}
        />
      )}
      {[-2.2, 2.4].map((x, side) => (
        <group
          key={x}
          position={[x, 0.86, -0.05]}
          rotation={[0, 0, side ? -0.2 : 0.2]}
        >
          {[0.18, 0.32, 0.46].map((r) => (
            <Line
              key={r}
              points={Array.from({ length: 20 }, (_, i) => {
                const a = 0.25 * Math.PI + (i / 19) * 0.5 * Math.PI;
                return [Math.cos(a) * r, Math.sin(a) * r, 0] as Point;
              })}
              color="#b7c9b7"
              lineWidth={1.4}
              transparent
              opacity={0.55}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
function LanMatch({
  stage,
  motion,
  matchState,
}: {
  stage: number;
  motion: boolean;
  matchState?: LanState;
}) {
  const phase = stage <= 3 ? stage : 4 + ((stage - 4) % 3);
  const revision = Math.max(0, Math.floor((stage - 3) / 3));
  const current = matchState ?? {
    serverPosition: (revision + (phase === 5 ? 1 : 0)) % 2,
    clientPositions: [revision % 2, revision % 2],
    joined: stage >= 3,
  };
  const paths = useMemo(
    () => [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.66, -0.4, 1.02),
        new THREE.Vector3(-1.31, -0.58, 0.57),
        new THREE.Vector3(-0.68, -0.52, -0.25),
        new THREE.Vector3(0.36, -0.55, -0.35),
        new THREE.Vector3(1.64, -0.53, -0.25),
        new THREE.Vector3(2.13, -0.3, -0.05),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.5, -0.4, 1.41),
        new THREE.Vector3(0.85, -0.56, 0.85),
        new THREE.Vector3(-0.36, -0.52, -0.21),
        new THREE.Vector3(0.36, -0.55, -0.35),
        new THREE.Vector3(1.64, -0.53, -0.25),
        new THREE.Vector3(2.13, -0.3, -0.05),
      ]),
    ],
    [],
  );
  const updating = phase === 2 || phase === 5;
  return (
    <group>
      <Platform at={[0, -0.88, 0]} size={[6.8, 0.2, 3.75]} color="#dfe7d6" />
      <group position={[-2.18, 0.04, 0.96]} scale={0.94}>
        <GameClient state={current.joined ? current.clientPositions[0] : -1} />
        <Label at={[0, -0.83, 0.95]}>Тоглогч 1</Label>
      </group>
      <group position={[0.08, 0.04, 1.4]} scale={0.94}>
        <GameClient state={current.joined ? current.clientPositions[1] : -1} />
        <Label at={[0, -0.83, 0.95]}>Тоглогч 2</Label>
      </group>
      <group position={[-0.56, -0.48, -0.42]}>
        <Block size={[1.36, 0.3, 0.86]} color={colors.cream} rounding={0.1} />
        <Block
          size={[1.19, 0.03, 0.69]}
          at={[0, 0.165, 0]}
          color={colors.mint}
          rounding={0.015}
        />
        {[-0.44, -0.15, 0.15, 0.44].map((x) => (
          <Block
            key={x}
            size={[0.18, 0.085, 0.02]}
            at={[x, -0.014, 0.441]}
            color="#7b9585"
            rounding={0.016}
          />
        ))}
        <Label at={[0, 0.49, -0.18]}>Свич</Label>
      </group>
      <group position={[2.43, -0.01, -0.39]} scale={0.91}>
        <Server />
        <mesh position={[0, 0.83, 0.54]}>
          <planeGeometry args={[0.78, 0.47]} />
          <ScreenInk
            kind="game"
            state={stage < 2 ? -1 : current.serverPosition}
          />
        </mesh>
        <Label at={[0, -0.91, 1.02]} active={updating}>
          CS · LAN сервер
        </Label>
      </group>
      {paths.map((path, i) => (
        <Tube key={i} curve={path} width={0.043} color="#a9b5a0" />
      ))}
      {(phase === 1 || phase === 4) && (
        <Pulse
          key={`input-${stage}`}
          curve={paths[0]}
          once
          motion={motion}
          color="#d09a72"
        />
      )}
      {phase === 1 && (
        <Pulse
          key="join-two"
          curve={paths[1]}
          once
          motion={motion}
          color="#94b4cc"
        />
      )}
      {updating &&
        paths.map((path, i) => (
          <Pulse
            key={`state-${stage}-${i}`}
            curve={path}
            reverse
            once
            motion={motion}
            color="#6caa87"
          />
        ))}
    </group>
  );
}

function CampusBuilding({
  at,
  scale = 1,
  color = colors.cream,
}: {
  at: Point;
  scale?: number;
  color?: string;
}) {
  return (
    <group position={at} scale={scale}>
      <Block
        size={[1.13, 1.18, 0.94]}
        at={[0, -0.03, 0]}
        color={color}
        rounding={0.08}
      />
      <Block
        size={[1.3, 0.15, 1.09]}
        at={[0, 0.63, 0]}
        color={colors.peach}
        rounding={0.055}
      />
      {[-0.29, 0.29].map((x) =>
        [-0.21, 0.24].map((y) => (
          <Block
            key={`${x}-${y}`}
            size={[0.22, 0.25, 0.018]}
            at={[x, y, 0.481]}
            color={colors.blue}
            rounding={0.04}
          />
        )),
      )}
    </group>
  );
}
function ScopeScene({
  scope,
  motion,
  stage,
  matchState,
}: {
  scope: number;
  motion: boolean;
  stage: number;
  matchState?: LanState;
}) {
  const globe = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (globe.current && scope === 4 && motion)
      globe.current.rotation.y += delta * 0.045;
  });
  const globalRoutes = useMemo(() => {
    const nodes = [
      [-0.85, 0.4, 1.5],
      [0.8, 0.9, 1.1],
      [1.5, -0.2, 0.9],
      [-0.7, -1.2, 1.1],
      [0.1, -0.65, -1.5],
    ].map((p) => new THREE.Vector3(...p).normalize().multiplyScalar(1.89));
    return {
      nodes,
      routes: nodes.map((a, i) =>
        Array.from({ length: 50 }, (_, j) =>
          a
            .clone()
            .lerp(nodes[(i + 1) % nodes.length], j / 49)
            .normalize()
            .multiplyScalar(1.91 + Math.sin((j / 49) * Math.PI) * 0.3),
        ),
      ),
    };
  }, []);
  if (scope === 0)
    return (
      <group>
        <Platform at={[0, -1, 0]} size={[5.3, 0.2, 3.5]} color="#e6e5d2" />
        <group position={[0, 0.05, 0]}>
          <group scale={0.91}>
            <MusicPhone stage={4} running />
          </group>
        </group>
        <group position={[-1.5, -0.3, 0.4]} rotation={[0.22, 0.1, -0.28]}>
          <Block
            size={[0.5, 1.02, 0.12]}
            color={colors.peach}
            rounding={0.16}
          />
          <Block
            size={[0.68, 0.67, 0.19]}
            color={colors.lilac}
            rounding={0.18}
          />
          <Block
            size={[0.5, 0.49, 0.021]}
            at={[0, 0, 0.11]}
            color="#f3f2dc"
            rounding={0.14}
          />
        </group>
        <group position={[1.65, -0.2, 0.15]}>
          <Block
            size={[0.82, 0.46, 0.58]}
            at={[0, -0.35, 0]}
            color={colors.cream}
            rounding={0.2}
          />
          {[-0.22, 0.22].map((x) => (
            <group key={x}>
              <Ball at={[x, 0.17, 0]} size={0.16} color={colors.cream} />
              <Stem
                at={[x, -0.02, 0]}
                length={0.24}
                radius={0.06}
                color={colors.cream}
              />
            </group>
          ))}
        </group>
        <Line
          points={[
            [-1.1, -0.4, 0.1],
            [-0.55, -0.45, 0.35],
            [0, -0.4, 0.5],
            [0.8, -0.45, 0.4],
            [1.3, -0.4, 0.2],
          ]}
          color="#9fbba6"
          dashed
          dashSize={0.08}
          gapSize={0.09}
          lineWidth={2}
        />
        <Label at={[0, -1.1, 1.9]}>Утас ⇄ Bluetooth чихэвч</Label>
      </group>
    );
  if (scope === 1)
    return <LanMatch stage={stage} motion={motion} matchState={matchState} />;
  if (scope === 2 || scope === 3) {
    const count = scope === 2 ? 3 : 6,
      radius = scope === 2 ? 2.0 : 2.4;
    return (
      <group>
        <mesh position={[0, -0.82, 0]} receiveShadow>
          <cylinderGeometry args={[3.3, 3.3, 0.22, 64]} />
          <meshStandardMaterial
            color={scope === 2 ? "#e5e6ce" : "#dce8da"}
            roughness={0.9}
          />
        </mesh>
        <group position={[0, -0.49, 0]}>
          <Block
            size={[1.17, 0.33, 0.87]}
            color={colors.cream}
            rounding={0.1}
          />
          <Block
            size={[1.06, 0.035, 0.76]}
            at={[0, 0.183, 0]}
            color={colors.mint}
            rounding={0.015}
          />
          {[-0.36, -0.12, 0.12, 0.36].map((x) => (
            <Block
              key={x}
              size={[0.15, 0.095, 0.025]}
              at={[x, -0.01, 0.445]}
              color="#b3beaa"
              rounding={0.018}
            />
          ))}
        </group>
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2 + 0.3,
            x = Math.cos(a) * radius,
            z = Math.sin(a) * radius;
          return (
            <group key={i}>
              <CampusBuilding
                at={[x, -0.1, z]}
                scale={scope === 2 ? 1 : 0.75 + (i % 3) * 0.09}
                color={[colors.cream, colors.lilac, colors.blue][i % 3]}
              />
              <Line
                points={[
                  [0, -0.68, 0],
                  [x, -0.68, z],
                ]}
                color="#b9b18f"
                lineWidth={3}
              />
            </group>
          );
        })}
        <Label at={[0, -0.86, 3.75]}>
          {scope === 2
            ? "Хичээлийн байр ба номын сан"
            : "Хотын номын сангийн салбарууд"}
        </Label>
      </group>
    );
  }
  return (
    <group position={[0, 0.1, 0]}>
      <group ref={globe} rotation={[0.12, -0.15, -0.13]}>
        <mesh castShadow>
          <sphereGeometry args={[1.86, 64, 48]} />
          <meshStandardMaterial color={colors.mint} roughness={0.92} />
        </mesh>
        {[-0.9, 0, 0.9].map((y) => {
          const radius = Math.sqrt(1.87 ** 2 - y ** 2);
          return (
            <Line
              key={y}
              points={Array.from(
                { length: 81 },
                (_, i) =>
                  [
                    Math.cos((i / 80) * Math.PI * 2) * radius,
                    y,
                    Math.sin((i / 80) * Math.PI * 2) * radius,
                  ] as Point,
              )}
              color="#e9e9cc"
              lineWidth={1.5}
              transparent
              opacity={0.65}
            />
          );
        })}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
            <Line
              points={Array.from(
                { length: 81 },
                (_, j) =>
                  [
                    Math.cos((j / 80) * Math.PI * 2) * 1.87,
                    Math.sin((j / 80) * Math.PI * 2) * 1.87,
                    0,
                  ] as Point,
              )}
              color="#e9e9cc"
              lineWidth={1.5}
              transparent
              opacity={0.65}
            />
          </group>
        ))}
        {globalRoutes.nodes.map((p, i) => (
          <Ball
            key={i}
            at={p.toArray() as Point}
            size={0.15}
            color={i % 2 ? colors.cream : colors.peach}
          />
        ))}
        {globalRoutes.routes.map((points, i) => (
          <Line
            key={i}
            points={points}
            color={i % 2 ? "#e6b494" : "#f4e7c2"}
            lineWidth={3}
          />
        ))}
      </group>
      <Label at={[0, -2.3, 0.6]}>Гэрээс алсын үйлчилгээний сүлжээ рүү</Label>
    </group>
  );
}

function Framing({ kind }: { kind: ClaySceneProps["kind"] }) {
  const get = useThree((state) => state.get),
    size = useThree((state) => state.size),
    invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const cam = get().camera as THREE.OrthographicCamera;
    const bounds =
      kind === "journey"
        ? [9.65, 5.5]
        : kind === "router"
          ? [6.6, 5.5]
          : kind === "media"
            ? [7.7, 5.0]
            : [8.8, 6.3];
    cam.zoom = Math.min(size.width / bounds[0], size.height / bounds[1]);
    cam.updateProjectionMatrix();
    invalidate();
  }, [get, size.width, size.height, kind, invalidate]);
  return null;
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div
        role="status"
        style={{ padding: 28, color: "#65766c", textAlign: "center" }}
      >
        3D дүрслэлийг ачаалж чадсангүй. Доорх тайлбар болон удирдлагуудаар
        үргэлжлүүлээрэй.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function ClayScene({
  kind,
  motion,
  stage = 0,
  explode = 0.6,
  selectedPart = -1,
  medium = "copper",
  scope = 0,
  onSelect,
  running = true,
  matchState,
}: ClaySceneProps) {
  return (
    <SceneBoundary key={kind}>
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.5]}
        frameloop={motion ? "always" : "demand"}
        camera={{
          position: kind === "media" ? [3.8, 3.7, 10] : [5.8, 5.5, 10],
          zoom: 60,
          near: 0.1,
          far: 80,
        }}
        gl={{ antialias: true, alpha: true }}
        fallback={
          <div role="status">
            3D үзүүлэхэд WebGL хэрэгтэй. Тайлбар, удирдлагуудыг ашиглаарай.
          </div>
        }
      >
        <ambientLight intensity={0.65} />
        <hemisphereLight args={["#fffbea", "#acc0b6", 1.15]} />
        <directionalLight
          position={[-4, 7, 6]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-normalBias={0.04}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight
          position={[5, 3, -3]}
          color="#fbe5d3"
          intensity={1.35}
        />
        <Framing kind={kind} />
        {kind === "journey" && (
          <Journey stage={stage} motion={motion && running} running={running} />
        )}
        {kind === "router" && (
          <RouterModel
            explode={THREE.MathUtils.clamp(explode, 0, 1)}
            selectedPart={selectedPart}
            motion={motion}
            onSelect={onSelect}
          />
        )}
        {kind === "media" &&
          (medium === "copper" ? (
            <Copper explode={explode} motion={motion && stage > 0} />
          ) : medium === "fiber" ? (
            <Fiber explode={explode} motion={motion} signal={stage > 0} />
          ) : (
            <Radio motion={motion && stage > 0} stage={stage} />
          ))}
        {kind === "scale" && (
          <ScopeScene
            scope={THREE.MathUtils.clamp(scope, 0, 4)}
            matchState={matchState}
            stage={stage}
            motion={motion}
          />
        )}
        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.17}
          scale={12}
          blur={2.7}
          far={6}
          resolution={256}
          color="#748275"
        />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping={motion}
          dampingFactor={0.085}
          minPolarAngle={0.55}
          maxPolarAngle={1.75}
          target={[0, 0, 0]}
        />
      </Canvas>
    </SceneBoundary>
  );
}
