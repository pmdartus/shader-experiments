import UniformColor from "./UniformColor";

import Brick from "./Brick";
import Checker from "./Checker";
import GradientAxial from "./GradientAxial";
import GradientLinear1 from "./GradientLinear1";
import GradientLinear2 from "./GradientLinear2";
import GradientLinear3 from "./GradientLinear3";

import Output from "./Output";

export default [
  {
    label: "Uniform Color",
    node: UniformColor,
  },
  {
    label: "Brick",
    node: Brick,
  },
  {
    label: "Checker",
    node: Checker,
  },
  {
    label: "Gradient Axial",
    node: GradientAxial,
  },
  {
    label: "Gradient Linear 1",
    node: GradientLinear1,
  },
  {
    label: "Gradient Linear 2",
    node: GradientLinear2,
  },
  {
    label: "Gradient Linear 3",
    node: GradientLinear3,
  },
  {
    label: "Output",
    node: Output,
  },
];
