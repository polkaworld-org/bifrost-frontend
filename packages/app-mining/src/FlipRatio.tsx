import React, { useState, useEffect } from "react";

import FlipNumbers from "react-flip-numbers";


function FlipRatio ({ height, width, nonFontSize, currentBalance }: Props): React.ReactElement<Props> {
  return (
    <FlipNumbers
      play
      height={height}
      width={width}
      nonNumberStyle={{ fontSize: nonFontSize }}
      color="#4e4e4e"
      background="#ffffff"
      durationSeconds={0.8}
      numbers={currentBalance}
    />
  );
}

export default (FlipRatio);