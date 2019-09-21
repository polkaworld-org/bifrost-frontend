import React, { useState, useEffect } from "react";

import FlipNumbers from "react-flip-numbers";


function FlipRatio ({ currentBalance }: Props): React.ReactElement<Props> {
  return (
    <FlipNumbers
      play
      height={40}
      width={24}
      nonNumberStyle={{ fontSize: '40px' }}
      color="#4e4e4e"
      background="#ffffff"
      durationSeconds={0.8}
      numbers={currentBalance}
    />
  );
}

export default (FlipRatio);