import * as React from "react";
import Head from "next/head";
import { get, set } from 'idb-keyval';

import type { NextPage } from "next";

const filePickerOptions = {
  multiple: true,
  excludeAcceptAllOption: true,
  types: [
    {
      description: "Allowed video files",
      accept: {
        'video/*': ['.mp4'],
      }
    }
  ]
}

const fileHandleOpts: FileSystemHandlePermissionDescriptor = {
  mode: 'read',
}

const SelectFile: NextPage = () => {
  const handleAddVideos = async (event) => {
    const videoFileHandles = await window.showOpenFilePicker(filePickerOptions);

    videoFileHandles.forEach(async (videoFileHandle) => {
      const permission = await videoFileHandle.queryPermission(fileHandleOpts);
      const file = await videoFileHandle.getFile()
      console.log('file', file)
      if (permission !== 'granted') {
        await videoFileHandle.requestPermission(fileHandleOpts)
      }
    })

    set('videoFileHandles', videoFileHandles);
  }

  React.useEffect(() => {
    /*
    (async () => {
      const videoFileHandles = await get('videoFileHandles');
      console.log('loaded', videoFileHandles)
      videoFileHandles.forEach(async (videoFileHandle) => {
        if (await videoFileHandle.queryPermission(fileHandleOpts) !== 'granted') {
          console.log('=== needs permission to read')
          //await videoFileHandle.requestPermission(fileHandleOpts)
        }
      })
    })()
    */
  }, [])

  return (
    <>
      <Head>
        <title>FileSystemAccess API Test</title>
        <meta name="description" content="Tests the use of the File System API and persisting permissions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <input type="button" onClick={handleAddVideos} value="Add videos" />
      </div>
    </>
  );
};

export default SelectFile;