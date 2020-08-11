// ==UserScript==
// @name         ig-rightsnap
// @namespace    https://github.com/MaanuVazquez/
// @version      1.0
// @description  Tampermonkey script for getting images and videos to share amazing sh*tpost from instagram
// @author       MaanuVazquez
// @match        *.instagram.com
// @grant        none
// ==/UserScript==

const setup = () => {
  document.addEventListener('contextmenu', (e: Event) => {
    const elementRightClicked = e.target as Element
    const post = getPost(elementRightClicked)
    if (!e.target || !post) return

    e.preventDefault()

    copyContentToClipboard(getVideo(post) || getImage(post))
  })
}

const getPost = (element: Element): HTMLElement | null => {
  return element.closest('article')
}

const getVideo = (element: HTMLElement): HTMLVideoElement | null => {
  const videoElement = element.querySelector('video')
  return videoElement
}

const getImage = (element: HTMLElement): HTMLImageElement | void => {
  const images = Array.from(element.querySelectorAll('img'))

  if (!images.length) return

  for (const image of images) {
    if (image.srcset) {
      return image
    }
  }
}

const handleClipboardPermissions = async (): Promise<boolean> => {
  try {
    // @ts-ignore
    const { state } = await navigator.permissions.query({ name: 'clipboard-write', allowWithoutGesture: false })
    return state === 'granted'
  } catch (error) {
    console.log(error)
    return false
  }
}

const copyContentToClipboard = (source: HTMLVideoElement | HTMLImageElement | void) => {
  if (!source) return

  handleClipboardPermissions().then(isGranted => {
    if (!isGranted) console.error('Permission for clipboard denied')
    if (source.nodeName.toLowerCase() === 'video') {
      navigator.clipboard.writeText(source.src)
      return
    }

    handleImageToClipboard(source as HTMLImageElement | void)
  })
};

const getPNGBase64 = (image: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const tempImage = new Image()
    tempImage.crossOrigin = "anonymous"
    tempImage.src = image.src
    tempImage.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.height = tempImage.height
      canvas.width = tempImage.width
      ctx?.drawImage(tempImage, 0, 0)
      resolve(canvas.toDataURL())
    })
    tempImage.addEventListener('error', (e) => {
      reject(e)
    })
  })
}

const getPNGBlob = (base64: string): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: 'image/png' });
}

const handleImageToClipboard = async (image: HTMLImageElement | void): Promise<void> => {
  if (!image) return

  if (!('write' in navigator.clipboard)) {
    navigator.clipboard.writeText(image.src)
    return
  }

  const base64 = await getPNGBase64(image)
  const blob = getPNGBlob(base64)
  // @ts-ignore
  navigator.clipboard.write(
    // @ts-ignore
    [new ClipboardItem({ [blob.type]: blob })]
  )
}

(function () {
  setup();
})();