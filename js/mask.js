$(document).ready(() => {
    const COOKIE_PREFIX="ck_";
    const COOKIE_ROOT="root";
    const SPLIT = ' ';

    const $loginMask = document.getElementById('login-mask')

    const closeLogin = () => {
        const bodyStyle = document.body.style
        bodyStyle.width = ''
        bodyStyle.overflow = ''
        btf.animateOut(document.querySelector('#login .login-box'), 'search_close .5s')
        btf.animateOut($loginMask, 'to_hide 0.5s')
    }
  
    const openLogin = () => {
      const bodyStyle = document.body.style
      bodyStyle.width = '100%'
      bodyStyle.overflow = 'hidden'
      btf.animateIn($loginMask, 'to_show 0.5s')
      btf.animateIn(document.querySelector('#login .login-box'), 'titleScale 0.5s')
      setTimeout(() => { document.querySelector('#user').focus() }, 100)
      // shortcut: ESC
      document.addEventListener('keydown', function f (event) {
        if (event.code === 'Escape') {
          closeLogin()
          document.removeEventListener('keydown', f)
        }
      })
      document.addEventListener('keydown', function f (event) {
        if (event.code === 'Enter') {
          doSubmit()
          document.removeEventListener('keydown', f)
        }
      })
    }

    const doSubmit = () => {
        let user = $("#user").val();
	    let password = $("#password").val();
        if (user == undefined || user == "")
        {
            alert("请输入用户名")
            return
        }
        if (password == undefined || password == "")
        {
            alert("请输入密码")
            return
        }
	    password = CryptoJS.MD5(password).toString();
	    $.cookie(COOKIE_PREFIX + user, password, { expires: 30, path: '/' });
        closeLogin();
        doUnMask();
    }
  
    const loginClickFn = () => {
      document.querySelector('#copyright').addEventListener('click', openLogin);
      document.querySelector('#login .login-close-button').addEventListener('click', closeLogin)
      $loginMask.addEventListener('click', closeLogin)
      document.querySelector('#login #login-submit').addEventListener('click', doSubmit)
    }

    loginClickFn();

    const getMaskIndex = (password, signs, expires) => {
        let now = new Date();
        if (password == undefined)
        {
            return -1;
        }
        else
        {
            if (signs == undefined)
            {
                return -2;
            }
            let index = signs.indexOf(CryptoJS.SHA1(password).toString());
            if (index == -1)
            {
                return -3;
            }
            if (expires == undefined || parseInt(expires[index]) < now.getTime())
            {
                return -4;
            }
            return index;
        }
    }

    const __encryptAES = (data, key) => {
        key = CryptoJS.enc.Utf8.parse(key);
        let encryptedData = CryptoJS.AES.encrypt(data, key, {
            iv: key,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
      return encryptedData.ciphertext.toString();
    }

    const __decryptAES = (data, key) => {
        key = CryptoJS.enc.Utf8.parse(key);
        let encryptedHexStr = CryptoJS.enc.Hex.parse(data);
        let encryptedBase64Str = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        var decryptedData = CryptoJS.AES.decrypt(encryptedBase64Str, key, {
            iv: key,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return decryptedData.toString(CryptoJS.enc.Utf8);
    }

    const __decrypt = (data, key, algo) => {
        switch (algo)
        {
            case "AES":
                return __decryptAES(data, key);
            case "DES":
            case "TripleDES":
            case "Rabbit":
            case "RC4":
            default:
                return __decryptAES(data, key);
        }
    }
    
    const unMaskData = (ele) => {
        let signs = ele.dataset.sign.split(SPLIT);
        let expires = ele.dataset.expire.split(SPLIT);
        let masks = ele.dataset.mask.split(SPLIT);
        let algo = ele.dataset.algo;

        for (cookieName of [ ele.dataset.cookie, COOKIE_ROOT])
        {
            let password = $.cookie(COOKIE_PREFIX + cookieName);
            let i = getMaskIndex(password, signs, expires);
            if (i >= 0)
            {
                let data = __decrypt(masks[i], password, algo);
                return {data: data, ok: true};
            }
        }
        return {data: undefined, ok: false};
    }

    const unMaskFns = [];
    const doUnMask = ()=> {
        for (f of unMaskFns)
        {
            f();
        }
    }
    const addUnMaskFn = (f) => {
        unMaskFns.push(f);
    }
    const unMaskForImage = () => {
        let eleList = document.querySelectorAll("img[mask=true]");
        for (ele of eleList)
        {
            let r = unMaskData(ele);
            if (r.ok == true)
            {
                ele.setAttribute("src", r.data);
                ele.style.display = 'block';
            }
        }
    }
    const renderMath = () => {
        renderMathInElement(document.body, {
          // customised options
          // • auto-render specific keys, e.g.:
          delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\(', right: '\\)', display: false},
              {left: '\\[', right: '\\]', display: true}
          ],
          // • rendering keys, e.g.:
          throwOnError : false
        })
    }
    const unMaskForBlog = () => {
        let contentEles = document.querySelectorAll("#mask_blog");
        for (contentEle of contentEles)
        {
            let bodyEle = document.querySelector("#blog-content")
            let r = unMaskData(contentEle);
            if (r.ok == true)
            {
                bodyEle.innerHTML = r.data;
                unMaskForImage()
                renderMath()
            }
        }
    }
    addUnMaskFn(unMaskForBlog);
    addUnMaskFn(unMaskForImage);
    doUnMask();
});