import * as React from "react";
import { get, set } from 'idb-keyval';
import Head from "next/head";

import type { NextPage } from "next";

const directoryPermissions: FileSystemHandlePermissionDescriptor = {
  //mode: 'readwrite', // use this when testing writing from service worker
  mode: 'read'
}

const Home: NextPage = () => {
  const [directoryHandle, setDirectoryHandle] = React.useState<FileSystemDirectoryHandle | null>(null);
  const [directoryHandleExpired, setDirectoryHandleExpired] = React.useState<boolean | null>(null);
  const [videos, setVideos] = React.useState<Array<File>>([])

  /**
   * On picking a directory handle, store in storage and react state
   */
  const handleChooseDirectory = React.useCallback(async () => {
    if ('showDirectoryPicker' in window === false) {
      console.error('Browser does not support File System Access API');
    }

    try {
      const directoryHandle = await window.showDirectoryPicker();
      await directoryHandle.requestPermission(directoryPermissions)
      await set('directoryHandle', directoryHandle);
      setDirectoryHandle(directoryHandle);
      setDirectoryHandleExpired(false)
    } catch (AbortError) {
      console.error('User aborted, must select (trigger a flash error here)')
    }
  }, [])

  /**
   * Clears the stored directory handle
   */
  const handleClearDirectory = React.useCallback(async () => {
    await set('directoryHandle', null);
    setDirectoryHandle(null);
  }, [])

  /**
   * On load, grab the directory handle from storage and set into the state if present
   */
  React.useEffect(() => {
    (async () => {

      // restore directory handle from storage
      const directoryHandle = await get('directoryHandle');
      setDirectoryHandle(directoryHandle)

      if (!directoryHandle) {
        return;
      }
    
      // Check if we need to prompt for access again
      if (await directoryHandle.queryPermission(directoryPermissions) === 'prompt') {
        setDirectoryHandleExpired(true)
      }  
    })()
  }, [])

  /**
   * Used to populate the videos
   */
  React.useEffect(() => {
    (async () => {
      if (!directoryHandle || directoryHandleExpired === null || directoryHandleExpired === true) {
        return
      }

      let videos = [];

      for await (const [fileName, handle] of directoryHandle.entries()) {
        if (handle instanceof FileSystemFileHandle ) {
          const file = await handle.getFile();
          videos.push(file)
        }
      }

      setVideos(videos)
    })();
  }, [directoryHandle, directoryHandleExpired])

  /**
   * Register the service worker on boot
   */
   React.useEffect(() => {
    navigator.serviceWorker.register("/file_writer_sw.js").then(
      function (registration) {
        console.log("Service Worker registration successful with scope", registration.scope);
      },
      function (err) {
        console.log("Service Worker registration failed", err);
      }
    );
  }, [])

  /**
   * Trigger periodic writes to the file
   */
   React.useEffect(() => {
    let interval: NodeJS.Timer;

    (async () => {
      // If the directory is being set, send it to the service worker
      await navigator.serviceWorker.ready

      interval = setInterval(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'WRITE_INTERVAL_FILE',
          });
        }
      }, 2000);

    })()

    return () => {
      clearInterval(interval);
    }
  }, [directoryHandle])

  const renderedVideos = videos.map((file) => {
    const handleLoad = (el: HTMLVideoElement) => {
      const url = URL.createObjectURL(file)
      el.src = url;
    }

    return (
      <div key={file.name}>
        <video controls ref={handleLoad} />
      </div>
    )
  })

  return (
    <>
      <Head>
        <title>FileSystemAccess API Test</title>
        <meta name="description" content="Tests the use of the File System API and persisting permissions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <h1>Reading local video files test</h1>
        <p>
          <em>Open console to see log and track behaviour. You will need to reload on first load to activate the service worker.</em>
        </p>
        {!directoryHandle && (
          <>
            <p>
              No directory set
            </p>
            <p>
              <button onClick={(_event) => handleChooseDirectory()}>
                Pick a directory
              </button>
            </p>
          </>
        )}
        {directoryHandle && (
          <>
            <p>
              Directory set: <strong>{directoryHandle.name}</strong>
            </p>
            <button onClick={(_event) => handleClearDirectory()}>
              Clear stored directory
            </button>
            {directoryHandleExpired === true && (
              <strong>Permissions expired, directory needs to be picked again</strong>
            )}
            {directoryHandleExpired === false && (
              <>
                <h2>Videos</h2>
                {renderedVideos.length === 0 && (
                  <p><em>No videos loaded yet</em></p>
                )}
                {renderedVideos}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
