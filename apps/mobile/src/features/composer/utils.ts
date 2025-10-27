import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import type { UsComposerAspect } from '@us/types';

type ManipulatorActions = Parameters<typeof manipulateAsync>[1];

type BuildOptions = {
  aspect: UsComposerAspect;
  mirrorMine: boolean;
};

export async function buildSideBySide(myUri: string, theirUri: string, opts: BuildOptions) {
  const targetH = 1200;
  const buildResizeActions = (mirror: boolean): ManipulatorActions => {
    const actions: ManipulatorActions = [{ resize: { height: targetH } }];
    if (mirror) {
      actions.unshift({ flip: FlipType.Horizontal });
    }
    return actions;
  };

  const myPrep = await manipulateAsync(myUri, buildResizeActions(opts.mirrorMine), {
    compress: 1,
    format: SaveFormat.PNG,
  });

  const theirPrep = await manipulateAsync(
    theirUri,
    [{ resize: { height: targetH } }],
    { compress: 1, format: SaveFormat.PNG },
  );

  const wEach = Math.round(
    targetH * (opts.aspect === '1:1' ? 1 : opts.aspect === '4:5' ? 0.8 : 0.75),
  );
  const totalW = wEach * 2;

  const base = await manipulateAsync(
    myPrep.uri,
    [{ resize: { width: totalW, height: targetH } }],
    { format: SaveFormat.PNG },
  );
  const placedMine = await manipulateAsync(
    base.uri,
    [{ overlay: myPrep.uri, position: { x: 0, y: 0 } }],
    { format: SaveFormat.PNG },
  );
  const finalImg = await manipulateAsync(
    placedMine.uri,
    [{ overlay: theirPrep.uri, position: { x: wEach, y: 0 } }],
    { format: SaveFormat.PNG },
  );
  return finalImg.uri;
}
