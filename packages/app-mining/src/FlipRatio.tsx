import React, { useState, useEffect } from "react";

import FlipNumbers from "react-flip-numbers";


function FlipRatio ({ ratio, veosBalance }: Props): React.ReactElement<Props> {
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    if(ratio) {
      setCurrentBalance(veosBalance/ratio);
    }
  }, [setCurrentBalance]);

  return (
    <FlipNumbers
      play
      height={13}
      width={8}
      color="white"
      background={'#fff'}
      durationSeconds={0.8}
      numbers={currentBalance > 0 ? currentBalance : 'Loading...'}
    />
  );
}

export default (FlipRatio);