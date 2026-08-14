// engine_mascot_base_actions_only_v7.js — official-asset-first mascot controller.
// Temporary all-language policy: every supported WordArk language loads the
// same FR-B Mime rig until more approved avatars/reactions are added later.
// The SVG is a semantic rig with independently animated limbs and facial parts.
// Only base actions are included; no negative state is used.

(function(){
  const MASCOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 99 225" width="99" height="225" id="fox" class="mascot-svg">
  <defs>
    <linearGradient id="fox-orange" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#F47A18"/>
      <stop offset="0.58" stop-color="#EE6D13"/>
      <stop offset="1" stop-color="#E85D0E"/>
    </linearGradient>
    <linearGradient id="fox-ear-pink" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#F68A63"/>
      <stop offset="1" stop-color="#E95745"/>
    </linearGradient>
    <linearGradient id="fox-mouth-fur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF4E7"/>
      <stop offset="1" stop-color="#F7E6D3"/>
    </linearGradient>
    <linearGradient id="fox-shirt" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#F47B18"/>
      <stop offset="0.62" stop-color="#EB6B13"/>
      <stop offset="1" stop-color="#D95D10"/>
    </linearGradient>
    <linearGradient id="fox-scarf" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#24933A"/>
      <stop offset="0.58" stop-color="#1A812F"/>
      <stop offset="1" stop-color="#126B22"/>
    </linearGradient>
    <linearGradient id="fox-hand" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#FFB36B"/>
      <stop offset="1" stop-color="#F0954E"/>
    </linearGradient>
    <linearGradient id="fox-pants" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#363638"/>
      <stop offset="1" stop-color="#242426"/>
    </linearGradient>
    <linearGradient id="fox-boot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#252526"/>
      <stop offset="1" stop-color="#111112"/>
    </linearGradient>
    <linearGradient id="fox-nose-shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#080906"/>
      <stop offset="0.58" stop-color="#17160F"/>
      <stop offset="1" stop-color="#33291B"/>
    </linearGradient>
    <clipPath id="sleeve-cloth-left-clip" clipPathUnits="userSpaceOnUse">
      <path d="M38.8 129.0
               C31.7 129.7 25.2 135.1 21.9 143.1
               C19.6 148.8 20.4 154.3 24.7 157.2
               C28.6 159.7 33.7 157.0 35.5 152.0
               L42.0 137.0 Z"/>
      <path d="M37.3 131.1
               C31.6 132.0 26.2 136.7 23.3 143.4
               C21.2 148.1 21.7 152.4 24.8 154.3
               C28.1 156.3 31.7 154.3 33.2 150.6
               C34.2 147.4 33.2 144.3 31.5 142.1
               C33.3 139.7 36.4 137.7 39.5 137.0 Z"/>
      <ellipse cx="25.5" cy="150.4" rx="5.9" ry="5.4"
               transform="rotate(-9 25.5 150.4)"/>
    </clipPath>
    <clipPath id="sleeve-cloth-right-clip" clipPathUnits="userSpaceOnUse">
      <path d="M68.2 129.0
               C75.3 129.7 81.8 135.1 85.1 143.1
               C87.4 148.8 86.6 154.3 82.3 157.2
               C78.4 159.7 73.3 157.0 71.5 152.0
               L65.0 137.0 Z"/>
      <path d="M69.7 131.1
               C75.4 132.0 80.8 136.7 83.7 143.4
               C85.8 148.1 85.3 152.4 82.2 154.3
               C78.9 156.3 75.3 154.3 73.8 150.6
               C72.8 147.4 73.8 144.3 75.5 142.1
               C73.7 139.7 70.6 137.7 67.5 137.0 Z"/>
      <ellipse cx="81.5" cy="150.4" rx="5.9" ry="5.4"
               transform="rotate(9 81.5 150.4)"/>
    </clipPath>
  </defs>

  <g id="ground-shadow">
    <ellipse cx="53.5" cy="201.5" rx="44.5" ry="4.6" fill="#D9D4CD" opacity="0.82"/>
    <ellipse cx="53.5" cy="200.7" rx="31.5" ry="2.6" fill="#A9A6A2" opacity="0.28"/>
  </g>

  <g id="fox-full-character-rig-v24">
    <g id="body-complete">
    <g id="lower-body">
      <g id="pants-underlap" fill="url(#fox-pants)">
        <path d="M32.7 168.8
                 C42.2 167.8 64.2 167.8 74.4 168.8
                 L74.5 181.8
                 C69.0 184.0 61.8 184.1 54.1 181.1
                 C47.1 184.2 39.0 184.0 32.8 181.5 Z"/>
      </g>
      <g id="leg-left" fill="url(#fox-pants)">
        <path d="M33.0 174.0
                 C38.0 172.8 46.2 172.8 52.8 174.1
                 L52.2 191.9
                 C47.5 193.4 39.2 193.4 33.4 191.5 Z"/>
        <path d="M34.0 175.0 L38.0 175.0 L37.7 190.2
                 C36.6 191.0 35.6 191.0 34.4 190.4 Z"
              fill="#4A4A4D" opacity="0.48"/>
      </g>
      <g id="leg-right" fill="url(#fox-pants)">
        <path d="M54.7 174.0
                 C61.2 172.8 69.1 172.8 74.1 174.0
                 L73.8 191.4
                 C68.4 193.4 60.2 193.4 55.2 191.8 Z"/>
        <path d="M70.8 175.0 L73.8 175.0 L73.5 190.2
                 C72.5 191.1 71.6 191.1 70.7 190.4 Z"
              fill="#171719" opacity="0.46"/>
      </g>
      <g id="boot-left" fill="url(#fox-boot)">
        <path d="M33.4 186.5
                 C37.8 185.3 45.4 185.3 49.5 187.0
                 C50.7 189.0 52.8 190.3 54.2 192.3
                 C56.1 195.0 55.4 198.8 52.4 200.4
                 C47.7 202.6 34.2 202.8 28.9 201.1
                 C25.6 200.0 25.3 196.0 27.2 193.1
                 C28.8 190.6 31.1 188.5 33.4 186.5 Z"/>
        <path d="M28.6 198.0 C34.6 199.5 47.5 199.4 53.0 197.8
                 C52.2 200.4 48.2 201.3 41.3 201.5
                 C34.2 201.5 29.4 200.8 28.6 198.0 Z"
              fill="#09090A" opacity="0.46"/>
      </g>
      <g id="boot-right" fill="url(#fox-boot)">
        <path d="M58.8 186.7
                 C63.2 185.3 70.7 185.3 74.6 187.0
                 C76.0 189.0 78.8 190.2 80.4 192.4
                 C82.5 195.1 82.1 199.0 79.0 200.6
                 C74.3 202.7 61.1 202.8 56.7 201.1
                 C53.7 199.8 53.1 196.1 54.8 193.0
                 C55.9 190.7 57.4 188.6 58.8 186.7 Z"/>
        <path d="M56.2 198.0 C62.5 199.5 75.3 199.4 80.1 197.9
                 C79.5 200.4 75.4 201.4 68.5 201.5
                 C61.7 201.5 57.1 200.8 56.2 198.0 Z"
              fill="#09090A" opacity="0.46"/>
      </g>
    </g>

    <g id="upper-body">
    <g id="torso-and-arms">
      <!-- V24: the brown opening is a fixed part of the orange sleeve, not an
           independent animated shade. It moves with the sleeve and is revealed
           only by the sleeve clip and the paw/forearm overlap in front of it. -->
      <g id="arm-left">
        <path id="arm-left-shoulder-underlap" fill="url(#fox-shirt)"
              d="M38.8 129.0
                 C31.7 129.7 25.2 135.1 21.9 143.1
                 C19.6 148.8 20.4 154.3 24.7 157.2
                 C28.6 159.7 33.7 157.0 35.5 152.0
                 L42.0 137.0 Z"/>
        <g id="upper-arm-left">
          <path id="upper-arm-left-shape" fill="url(#fox-shirt)"
                d="M37.3 131.1
                   C31.6 132.0 26.2 136.7 23.3 143.4
                   C21.2 148.1 21.7 152.4 24.8 154.3
                   C28.1 156.3 31.7 154.3 33.2 150.6
                   C34.2 147.4 33.2 144.3 31.5 142.1
                   C33.3 139.7 36.4 137.7 39.5 137.0 Z"/>
          <ellipse cx="25.5" cy="150.4" rx="5.9" ry="5.4"
                   fill="#E96512" opacity="0.96"
                   transform="rotate(-9 25.5 150.4)"/>
          <g id="sleeve-opening-left-clip"
             clip-path="url(#sleeve-cloth-left-clip)">
            <g id="sleeve-opening-left"
               transform="translate(25.5 145.3) scale(1.55 3.2) translate(-25.5 -145.3)">
              <ellipse id="sleeve-opening-left-rim"
                       cx="25.5" cy="149.2" rx="6.6" ry="3.9"
                       fill="#B7460D" opacity="1"
                       transform="rotate(-9 25.5 149.2)"/>
              <ellipse id="sleeve-opening-left-shadow"
                       cx="25.5" cy="149.1" rx="5.7" ry="3.0"
                       fill="#6F2609" opacity="0.98"
                       transform="rotate(-9 25.5 149.1)"/>
            </g>
          </g>
        </g>
        <g id="forearm-left">
          <ellipse id="forearm-left-underlap"
                   cx="25.8" cy="153.0" rx="4.3" ry="7.2"
                   fill="#F7A65E"/>
          <g id="hand-left">
            <path id="hand-left-shape" fill="url(#fox-hand)"
                  d="M23.7 146.8
                     C21.0 149.8 20.0 154.7 20.7 159.4
                     C21.5 164.3 23.4 168.3 26.2 169.7
                     C28.6 170.9 31.1 169.5 31.8 166.7
                     C32.4 163.6 31.7 159.4 30.6 155.8
                     C29.5 152.0 28.1 148.7 26.4 146.9
                     C25.5 146.4 24.5 146.4 23.7 146.8 Z"/>
          </g>
        </g>
      </g>

      <g id="arm-right">
        <path id="arm-right-shoulder-underlap" fill="url(#fox-shirt)"
              d="M68.2 129.0
                 C75.3 129.7 81.8 135.1 85.1 143.1
                 C87.4 148.8 86.6 154.3 82.3 157.2
                 C78.4 159.7 73.3 157.0 71.5 152.0
                 L65.0 137.0 Z"/>
        <g id="upper-arm-right">
          <path id="upper-arm-right-shape" fill="url(#fox-shirt)"
                d="M69.7 131.1
                   C75.4 132.0 80.8 136.7 83.7 143.4
                   C85.8 148.1 85.3 152.4 82.2 154.3
                   C78.9 156.3 75.3 154.3 73.8 150.6
                   C72.8 147.4 73.8 144.3 75.5 142.1
                   C73.7 139.7 70.6 137.7 67.5 137.0 Z"/>
          <ellipse cx="81.5" cy="150.4" rx="5.9" ry="5.4"
                   fill="#D95D10" opacity="0.96"
                   transform="rotate(9 81.5 150.4)"/>
          <g id="sleeve-opening-right-clip"
             clip-path="url(#sleeve-cloth-right-clip)">
            <g id="sleeve-opening-right"
               transform="translate(81.5 145.3) scale(1.55 3.2) translate(-81.5 -145.3)">
              <ellipse id="sleeve-opening-right-rim"
                       cx="81.5" cy="149.2" rx="6.6" ry="3.9"
                       fill="#A93E0C" opacity="1"
                       transform="rotate(9 81.5 149.2)"/>
              <ellipse id="sleeve-opening-right-shadow"
                       cx="81.5" cy="149.1" rx="5.7" ry="3.0"
                       fill="#642207" opacity="0.98"
                       transform="rotate(9 81.5 149.1)"/>
            </g>
          </g>
        </g>
        <g id="forearm-right">
          <ellipse id="forearm-right-underlap"
                   cx="81.2" cy="153.0" rx="4.3" ry="7.2"
                   fill="#F7A65E"/>
          <g id="hand-right">
            <path id="hand-right-shape" fill="url(#fox-hand)"
                  d="M83.3 146.8
                     C86.0 149.8 87.0 154.7 86.3 159.4
                     C85.5 164.3 83.6 168.3 80.8 169.7
                     C78.4 170.9 75.9 169.5 75.2 166.7
                     C74.6 163.6 75.3 159.4 76.4 155.8
                     C77.5 152.0 78.9 148.7 80.6 146.9
                     C81.5 146.4 82.5 146.4 83.3 146.8 Z"/>
          </g>
        </g>
      </g>

      <g id="shirt-body" fill="url(#fox-shirt)">
        <path id="shirt-underlap"
              d="M34.0 126.8
                 C43.3 123.8 63.3 123.8 72.8 127.0
                 C77.4 137.4 78.0 153.6 76.0 171.7
                 C66.2 174.0 42.1 174.1 31.2 171.5
                 C29.6 153.4 30.0 137.5 34.0 126.8 Z"/>
        <path fill="#FF8A22" opacity="0.25"
              d="M35.5 132.0 C38.8 128.7 43.0 127.0 47.0 127.0
                 L46.0 170.0 C42.2 171.2 38.0 171.2 34.4 170.0
                 C32.6 154.7 32.9 141.6 35.5 132.0 Z"/>
        <path fill="#BC4E0D" opacity="0.46"
              d="M72.0 129.0 C75.7 139.1 76.3 154.5 74.8 170.5
                 C72.1 171.2 69.7 171.5 67.4 171.3 L68.2 132.0 Z"/>
      </g>

      <g id="scarf">
        <path id="scarf-safety-underlap" fill="#126B22"
              d="M25.0 118.6
                 C37.1 114.8 67.6 114.5 81.0 118.7
                 C87.3 121.8 91.4 128.1 93.1 134.6
                 C90.5 138.2 86.8 140.9 82.3 141.3
                 L78.4 137.1
                 C76.0 147.6 73.2 156.1 69.3 163.0
                 C54.3 154.2 41.0 145.6 28.8 137.5
                 L24.5 141.5
                 C19.7 140.2 15.7 138.0 13.0 135.2
                 C16.0 128.6 19.8 122.9 25.0 118.6 Z"/>
        <path id="scarf-main" fill="url(#fox-scarf)"
              d="M26.0 119.6
                 C36.1 118.0 45.2 121.5 54.8 123.2
                 C65.0 125.2 74.0 122.8 80.5 119.4
                 C86.0 122.4 90.1 128.1 92.1 134.0
                 C89.1 137.7 85.9 139.6 81.4 140.0
                 L77.8 135.8
                 C76.3 146.3 73.4 155.2 69.0 161.7
                 C54.7 153.5 41.3 145.4 29.3 137.0
                 L24.5 140.3
                 C20.1 139.5 16.6 137.5 14.1 134.8
                 C16.8 128.5 20.9 123.2 26.0 119.6 Z"/>
        <path id="scarf-fold" fill="#0D5C1D" opacity="0.72"
              d="M28.0 120.0
                 C39.0 125.0 49.5 129.0 61.7 129.6
                 C69.8 129.9 76.4 126.4 80.5 119.4
                 C81.6 123.9 79.6 129.7 74.0 134.3
                 C65.1 140.3 46.4 134.8 28.0 120.0 Z"/>
        <path id="scarf-highlight" fill="#35A54B" opacity="0.34"
              d="M20.2 129.5 C25.3 123.2 31.2 121.3 37.0 121.5
                 C33.1 126.9 30.2 132.3 29.3 137.0 L24.5 140.3
                 C20.5 139.4 17.2 137.6 14.9 135.2 Z"/>
      </g>
    </g>
    </g>
    </g>

  <g id="head-complete">
  <g id="fox-head-rig-ready-v11">
    <g id="ear-left">
      <path id="ear-left-base" fill="url(#fox-orange)" d="M20 7.9
               C21.4 8.0 31.8 17.5 38.7 28.5
               C45.5 39.3 49.6 50.3 50.8 61.8
               C44.8 60.0 38.0 60.8 32.0 64.4
               C27.0 67.5 24.1 70.8 23.0 73.2
               C19.2 67.7 17.1 58.8 15.8 48.0
               C14.1 35.1 14.5 20.8 16.1 13.0
               C17.2 10.0 19.1 8.0 20 7.9 Z"/>
      <path id="ear-left-tip" fill="#43210F"
            d="M20 7.9
               C21.4 8.0 31.8 17.5 38.7 28.5
               C35.0 29.2 31.8 31.1 29.1 34.1
               C26.4 25.4 22.3 17.1 16.3 12.5
               C17.4 9.8 19.2 8.0 20 7.9 Z"/>
      <path id="ear-left-fold" fill="#A14411" opacity="0.82"
            d="M29.1 34.1
               C32.1 31.2 35.2 29.4 38.7 28.5
               C43.1 35.5 46.4 42.8 48.4 50.5
               C44.0 52.4 40.4 56.0 36.5 60.0
               C34.7 50.9 32.4 42.3 29.1 34.1 Z"/>
      <path id="ear-left-inner" fill="url(#fox-ear-pink)"
            d="M22.0 22.0
               C25.8 29.4 29.3 39.1 32.5 50.7
               C31.5 57.2 28.8 63.5 24.4 68.3
               C20.8 63.6 18.8 56.0 18.2 47.0
               C17.7 37.3 18.8 28.1 22.0 22.0 Z"/>
      <path id="ear-left-inner-light" fill="#FF9A76" opacity="0.34"
            d="M21.4 30.7
               C23.6 38.0 25.3 48.2 25.6 60.2
               C23.0 59.2 21.5 55.0 20.8 48.5
               C20.2 41.3 20.3 35.4 21.4 30.7 Z"/>
    </g>
    <!-- V24: image-right ear rebuilt as the true reflected mate of the
         image-left ear. The child transforms preserve the mirror while the
         parent group remains free for ear animation. -->
    <g id="ear-right">
      <path id="ear-right-base" fill="url(#fox-orange)"
            transform="translate(110 0) scale(-1 1)"
            d="M20 7.9
               C21.4 8.0 31.8 17.5 38.7 28.5
               C45.5 39.3 49.6 50.3 50.8 61.8
               C44.8 60.0 38.0 60.8 32.0 64.4
               C27.0 67.5 24.1 70.8 23.0 73.2
               C19.2 67.7 17.1 58.8 15.8 48.0
               C14.1 35.1 14.5 20.8 16.1 13.0
               C17.2 10.0 19.1 8.0 20 7.9 Z"/>
      <path id="ear-right-tip" fill="#43210F"
            transform="translate(110 0) scale(-1 1)"
            d="M20 7.9
               C21.4 8.0 31.8 17.5 38.7 28.5
               C35.0 29.2 31.8 31.1 29.1 34.1
               C26.4 25.4 22.3 17.1 16.3 12.5
               C17.4 9.8 19.2 8.0 20 7.9 Z"/>
      <path id="ear-right-fold" fill="#A14411" opacity="0.82"
            transform="translate(110 0) scale(-1 1)"
            d="M29.1 34.1
               C32.1 31.2 35.2 29.4 38.7 28.5
               C43.1 35.5 46.4 42.8 48.4 50.5
               C44.0 52.4 40.4 56.0 36.5 60.0
               C34.7 50.9 32.4 42.3 29.1 34.1 Z"/>
      <path id="ear-right-inner" fill="url(#fox-ear-pink)"
            transform="translate(110 0) scale(-1 1)"
            d="M22.0 22.0
               C25.8 29.4 29.3 39.1 32.5 50.7
               C31.5 57.2 28.8 63.5 24.4 68.3
               C20.8 63.6 18.8 56.0 18.2 47.0
               C17.7 37.3 18.8 28.1 22.0 22.0 Z"/>
      <path id="ear-right-inner-light" fill="#FF9A76" opacity="0.34"
            transform="translate(110 0) scale(-1 1)"
            d="M21.4 30.7
               C23.6 38.0 25.3 48.2 25.6 60.2
               C23.0 59.2 21.5 55.0 20.8 48.5
               C20.2 41.3 20.3 35.4 21.4 30.7 Z"/>
    </g>

    <!-- A continuous pale silhouette sits behind the orange head and visible muzzle.
         It closes every raster-reference hole and remains hidden in the neutral pose. -->
    <g id="fur-safety-underlay" fill="url(#fox-mouth-fur)">
      <path d="M8.0 102.5
               C15.5 100.7 22.8 100.4 30.5 101.6
               C39.0 102.2 47.1 103.3 54.3 103.0
               C61.4 100.0 67.0 98.9 74.6 101.2
               C84.0 101.1 93.8 100.5 99.1 103.0
               C102.2 104.4 102.3 107.1 99.1 109.0
               C102.0 110.3 101.8 112.2 98.0 114.0
               C94.6 118.4 87.4 121.1 80.0 122.5
               C71.1 124.5 63.4 126.0 55.2 126.2
               C46.0 126.0 37.0 124.4 29.2 122.0
               C23.0 121.4 17.0 118.7 12.5 115.8
               C8.6 113.4 7.2 111.3 10.7 109.5
               C6.0 107.8 5.5 105.0 8.0 102.5 Z"/>
    </g>

    <g id="head-base" fill="url(#fox-orange)">
      <path id="head-core"
            d="M37.0 51.8
               C45.4 48.0 60.4 47.8 69.5 52.0
               C81.1 57.0 87.7 66.1 88.2 76.0
               C89.2 82.1 90.6 86.3 90.9 90.1
               C91.7 94.0 95.2 95.8 98.4 97.3
               C101.7 98.8 102.6 101.6 100.3 104.1
               C98.2 106.4 95.2 107.8 92.5 109.0
               C92.8 112.0 90.2 114.5 86.0 116.5
               C77.8 120.0 67.0 122.1 55.1 122.5
               C43.0 122.3 35.0 120.3 31.5 117.0
               C30.5 112.0 28.5 106.5 26.5 103.5
               C20.5 97.6 19.0 93.6 19.5 89.2
               C20.0 84.2 21.1 80.3 22.0 76.3
               C22.9 72.7 22.5 70.2 23.3 67.2
               C25.0 60.3 29.5 55.0 37.0 51.8 Z"/>
      <path id="cheek-left-flare"
            d="M21.0 91.0
               C19.2 94.8 16.2 97.1 12.3 99.0
               C8.9 100.8 7.2 102.8 8.2 105.0
               C9.1 107.1 11.8 108.8 14.4 109.4
               C16.0 110.0 17.6 109.4 17.5 108.4
               C16.0 107.5 14.8 107.1 14.2 106.7
               C14.0 106.2 15.2 105.6 18.3 105.0
               C19.2 104.1 22.0 103.8 24.0 103.6
               C26.7 103.2 25.5 95.0 21.0 91.0 Z"/>
      <path id="cheek-right-flare"
            d="M89.2 91.2
               C91.4 94.0 96.5 95.8 99.0 97.4
               C101.7 98.8 102.7 101.4 100.5 104.0
               C100.3 106.6 98.7 107.7 96.0 108.5
               C96.2 109.1 99.4 109.8 100.5 111.0
               C98.3 112.3 95.3 112.8 92.3 112.9
               C91.5 105.1 90.3 97.8 89.2 91.2 Z"/>
      <path id="cheek-right-accent" fill="#A14411" opacity="0.9"
            d="M94.6 95.2
               C98.0 96.5 101.2 98.2 101.4 101.2
               C101.4 104.0 99.1 106.2 96.0 107.4
               C96.3 103.4 95.9 99.3 94.6 95.2 Z"/>
    </g>
    <g id="mouth-fur" fill="url(#fox-mouth-fur)">
      <path id="muzzle-main"
            d="M25.5 102.8
               C35.0 102.6 45.7 102.6 54.1 102.8
               C58.2 102.8 60.6 101.2 63.4 100.4
               C66.7 99.6 71.1 100.4 74.5 101.8
               C81.0 102.5 88.5 101.7 94.7 102.4
               C98.2 102.8 100.6 104.3 100.7 105.6
               C99.3 106.8 96.4 107.6 93.8 108.3
               C96.2 109.1 99.4 109.7 100.6 110.9
               C99.0 112.3 97.0 113.0 95.5 113.2
               C93.5 116.0 88.5 118.6 81.5 120.5
               C70.6 122.6 63.2 124.6 55.7 124.9
               C48.0 124.7 42.0 123.1 35.4 122.0
               C31.8 121.4 29.0 119.2 31.0 117.0
               C26.5 115.4 24.8 114.3 24.8 113.5
               C23.8 112.8 21.8 111.3 21.5 109.5
               C20.5 107.5 20.8 105.8 23.0 105.0
               C22.0 104.2 23.5 103.3 25.5 102.8 Z"/>
      <path id="muzzle-lower-left-tuft"
            d="M11.0 111.5
               C13.8 111.3 16.5 112.6 19.2 114.0
               C21.5 115.4 24.5 116.0 26.0 116.2
               C27.5 116.5 29.3 116.7 30.5 116.9
               C29.0 118.7 27.0 120.0 25.0 120.2
               C21.0 119.2 18.0 117.9 15.5 116.3
               C12.5 114.5 10.8 112.7 11.0 111.5 Z"/>
    </g>
  </g>

  <g id="face-features">
    <g id="eye-left">
      <path id="eye-left-white" fill="#FFFFFF"
            d="M42.75 87.05
               C42.85 94.70 46.55 99.65 52.50 100.25
               C58.15 100.20 61.35 95.10 61.55 87.05
               C56.10 86.55 47.65 86.55 42.75 87.05 Z"/>
      <path id="eye-left-pupil" fill="#0B0C0A"
            d="M48.75 87.00
               L59.55 87.00
               C59.45 92.75 57.45 97.25 54.20 98.00
               C50.80 97.50 48.80 93.45 48.75 87.00 Z"/>
      <path id="eye-left-lid" fill="#21100A"
            d="M42.15 86.65
               C47.20 86.35 55.80 86.35 62.00 86.65
               L62.00 88.05
               C55.30 87.70 47.35 87.70 42.45 88.05 Z"/>
      <path id="eye-left-inner-fold" fill="#B5410B"
            d="M60.70 86.80 C61.15 85.25 61.35 83.60 61.45 82.15
               C62.00 83.95 62.05 85.65 61.70 87.25 Z"/>
    </g>

    <g id="eye-right">
      <path id="eye-right-white" fill="#FFFFFF"
            d="M70.60 87.05
               C70.85 93.55 73.65 98.25 78.25 98.95
               C82.85 98.75 85.15 94.05 85.25 87.05
               C81.20 86.55 74.55 86.55 70.60 87.05 Z"/>
      <path id="eye-right-pupil" fill="#0B0C0A"
            d="M72.20 87.00
               L81.55 87.00
               C81.40 92.65 79.45 96.45 76.55 97.05
               C73.70 96.60 72.20 93.20 72.20 87.00 Z"/>
      <path id="eye-right-lid" fill="#21100A"
            d="M70.45 86.65
               C74.55 86.35 81.75 86.35 85.50 86.65
               L85.45 88.05
               C81.45 87.70 74.55 87.70 70.75 88.05 Z"/>
      <path id="eye-right-outer-fold" fill="#421405"
            d="M70.55 87.20
               C70.72 86.45 70.95 85.65 71.28 85.10
               C71.75 85.85 71.82 86.60 71.60 87.25 Z"/>
      <path id="eye-right-inner-fold" fill="#B5410B"
            d="M84.85 86.80 C85.25 85.25 85.45 83.60 85.55 82.20
               C86.10 83.95 86.15 85.65 85.80 87.25 Z"/>
    </g>

    <path id="nose" fill="url(#fox-nose-shade)"
          d="M63.55 99.60
             C64.70 98.05 66.90 97.50 69.15 97.60
             C72.15 97.60 74.35 98.90 74.60 100.70
             C74.70 102.70 72.20 104.90 69.50 105.25
             C66.80 105.10 64.15 103.40 63.65 101.50
             C63.45 100.80 63.45 100.15 63.55 99.60 Z"/>

    <g id="mouth">
      <path id="mouth-open" fill="#211713"
            d="M57.00 108.05
               C58.25 109.95 60.80 111.20 64.05 111.50
               C67.00 111.55 69.45 110.25 71.00 108.35
               C70.45 112.65 68.05 115.25 64.55 115.50
               C61.15 115.35 58.25 112.55 57.00 108.05 Z"/>
      <path id="tongue" fill="#D82C18"
            d="M61.55 113.15
               C63.30 112.70 66.35 112.70 68.15 113.15
               C67.45 114.70 66.10 115.45 64.55 115.50
               C63.15 115.40 62.20 114.65 61.55 113.15 Z"/>
      <path id="smile-edge-left" fill="none" stroke="#211713" stroke-width="1.35" stroke-linecap="round"
            d="M57.00 108.05 C57.65 109.25 58.45 110.25 59.45 111.05"/>
      <path id="smile-edge-right" fill="none" stroke="#211713" stroke-width="1.25" stroke-linecap="round"
            d="M68.90 111.05 C69.75 110.20 70.45 109.25 71.00 108.35"/>
    </g>
  </g>

  <g id="expression-happy-eyes" opacity="0" fill="none" stroke="#21100A"
     stroke-width="2.15" stroke-linecap="round">
    <path d="M44.8 95.0 C48.7 89.8 56.6 89.6 60.4 94.8"/>
    <path d="M71.6 94.2 C74.7 90.0 81.3 89.8 84.4 93.8"/>
  </g>
  <g id="expression-sad-eyes" opacity="0" fill="none" stroke="#21100A"
     stroke-width="2.0" stroke-linecap="round">
    <path d="M44.5 91.0 C49.0 94.4 56.2 94.5 60.5 91.4"/>
    <path d="M71.5 91.2 C75.2 94.0 81.2 94.0 84.6 90.8"/>
  </g>
  <g id="mouth-wide" opacity="0">
    <path fill="#211713"
          d="M56.7 108.0 C59.3 109.3 62.2 109.8 65.0 109.8
             C67.8 109.8 70.3 109.1 72.0 107.9
             C71.3 113.9 68.8 117.1 64.5 117.3
             C60.1 117.0 57.4 113.8 56.7 108.0 Z"/>
    <path fill="#D82C18"
          d="M59.8 114.2 C62.2 113.5 67.0 113.5 69.5 114.2
             C68.4 116.2 66.7 117.2 64.5 117.3
             C62.4 117.2 60.8 116.2 59.8 114.2 Z"/>
  </g>
  <g id="mouth-o" opacity="0">
    <ellipse cx="64.7" cy="112.1" rx="3.7" ry="4.5" fill="#211713"/>
    <ellipse cx="64.7" cy="114.2" rx="2.0" ry="1.1" fill="#D82C18"/>
  </g>
  <g id="expression-blink-eyes" opacity="0" fill="none" stroke="#21100A"
     stroke-width="2.1" stroke-linecap="round">
    <path d="M43.0 93.5 Q52.2 96.5 61.2 93.3"/>
    <path d="M71.0 93.3 Q78.2 96.3 85.2 93.0"/>
  </g>
  <g id="mouth-frown" opacity="0" fill="none" stroke="#211713"
     stroke-width="1.8" stroke-linecap="round">
    <path d="M58.7 115.0 C61.8 110.8 67.8 110.6 71.0 114.8"/>
  </g>
  </g>
  </g>
</svg>
`;

  const FALLBACK = {
    id:'fox',
    inline:MASCOT_SVG,
    playMs:750
  };
  const MIME_SVG = `<svg data-action-isolation-revision="idle-pull-dance-wall-locked-to-v21" data-release="base-actions-only-20260814" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 549" class="mascot-svg mascot-rig mascot-svg--fr-b-mime" data-mascot="fr-b-mime" role="img" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">
<metadata>Base Mime only. Preserved actions: idle, pull-rope play, dance, and invisible wall.</metadata>
<defs><clipPath id="fr-b-mime-face-clip"><rect x="108" y="95" width="104" height="105" rx="31" /></clipPath></defs>
<style>.rig-face-play,.rig-mouth-play,.rig-mouth-wall{display:none}.mascot-action-play .rig-mouth-idle{display:none}.mascot-action-play .rig-mouth-play,.mascot-action-wall .rig-mouth-wall{display:inline}.rig-hand-silhouette{fill:#eee9e2;stroke:#c5bdb5;stroke-width:1.1;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}</style>
<g id="fr-b-mime-shadow" class="rig-shadow" data-center-x="160" data-center-y="452" data-idle-x="0.00" data-idle-y="0.00" data-idle-scale-x="1.000" data-idle-scale-y="1.000" data-idle-opacity="0.620" data-pull-x="3.00" data-pull-y="0.00" data-pull-scale-x="1.040" data-pull-scale-y="1.000" data-pull-opacity="0.620" data-tug-x="-8.00" data-tug-y="0.00" data-tug-scale-x="1.100" data-tug-scale-y="1.000" data-tug-opacity="0.660" data-tugdeep-x="-14.00" data-tugdeep-y="0.00" data-tugdeep-scale-x="1.150" data-tugdeep-scale-y="1.000" data-tugdeep-opacity="0.680" data-danceleft-x="-8.00" data-danceleft-y="0.00" data-danceleft-scale-x="0.960" data-danceleft-scale-y="1.000" data-danceleft-opacity="0.600" data-danceright-x="8.00" data-danceright-y="0.00" data-danceright-scale-x="0.960" data-danceright-scale-y="1.000" data-danceright-opacity="0.600" data-danceopen-x="0.00" data-danceopen-y="0.00" data-danceopen-scale-x="1.060" data-danceopen-scale-y="1.000" data-danceopen-opacity="0.580" data-dancejump-x="0.00" data-dancejump-y="1.00" data-dancejump-scale-x="0.720" data-dancejump-scale-y="0.780" data-dancejump-opacity="0.400" data-wallcontact-x="0.00" data-wallcontact-y="0.00" data-wallcontact-scale-x="1.080" data-wallcontact-scale-y="1.000" data-wallcontact-opacity="0.620" data-wallleanleft-x="-18.00" data-wallleanleft-y="0.00" data-wallleanleft-scale-x="1.100" data-wallleanleft-scale-y="1.000" data-wallleanleft-opacity="0.640" data-walltravelright-x="18.00" data-walltravelright-y="0.00" data-walltravelright-scale-x="1.100" data-walltravelright-scale-y="1.000" data-walltravelright-opacity="0.640" data-walllowleft-x="-19.00" data-walllowleft-y="0.00" data-walllowleft-scale-x="1.130" data-walllowleft-scale-y="1.000" data-walllowleft-opacity="0.660" data-walllowright-x="19.00" data-walllowright-y="0.00" data-walllowright-scale-x="1.130" data-walllowright-scale-y="1.000" data-walllowright-opacity="0.660" transform="translate(160 452) scale(1 1) translate(-160 -452)" opacity=".620"><ellipse cx="160" cy="452" rx="54" ry="6" fill="#bdbdc1" /></g>
<g id="fr-b-mime-character-motion" class="rig-character-motion" data-pivot-x="160" data-pivot-y="314" data-idle-x="0.00" data-idle-y="28.00" data-idle-rotation="0.00" data-pull-x="2.00" data-pull-y="28.00" data-pull-rotation="2.50" data-tug-x="-8.00" data-tug-y="31.00" data-tug-rotation="-9.00" data-tugdeep-x="-14.00" data-tugdeep-y="34.00" data-tugdeep-rotation="-13.00" data-danceleft-x="-8.00" data-danceleft-y="26.00" data-danceleft-rotation="-4.00" data-danceright-x="8.00" data-danceright-y="26.00" data-danceright-rotation="4.00" data-danceopen-x="0.00" data-danceopen-y="23.00" data-danceopen-rotation="0.00" data-dancejump-x="0.00" data-dancejump-y="12.00" data-dancejump-rotation="0.00" data-wallcontact-x="0.00" data-wallcontact-y="28.00" data-wallcontact-rotation="0.00" data-wallleanleft-x="-18.00" data-wallleanleft-y="28.00" data-wallleanleft-rotation="-9.50" data-walltravelright-x="18.00" data-walltravelright-y="29.00" data-walltravelright-rotation="7.50" data-walllowleft-x="-8.00" data-walllowleft-y="46.00" data-walllowleft-rotation="-7.50" data-walllowright-x="12.00" data-walllowright-y="47.00" data-walllowright-rotation="6.50" transform="translate(0 28) rotate(0 160 314)">

<g id="fr-b-mime-torso-motion" class="rig-torso-motion">
<g id="fr-b-mime-leg-left" class="rig-leg rig-leg-left rig-variable-leg rig-articulated-leg" transform="translate(139.00 307.00)" data-rig="variable-width-leg" data-motion="continuous-hip-knee-ankle-interpolation" data-leg-length="103.00" data-hip-radius="9.92" data-knee-radius="8.32" data-ankle-radius="6.08" data-idle-knee-x="0.00" data-idle-knee-y="57.68" data-idle-ankle-x="0.00" data-idle-ankle-y="103.00" data-idle-foot-rotation="0.00" data-idle-rotation="0.00" data-pull-knee-x="-10.36" data-pull-knee-y="57.34" data-pull-ankle-x="-4.78" data-pull-ankle-y="104.22" data-pull-foot-rotation="-2.50" data-pull-rotation="2.63" data-tug-knee-x="-29.73" data-tug-knee-y="51.13" data-tug-ankle-x="-29.11" data-tug-ankle-y="93.22" data-tug-foot-rotation="9.00" data-tug-rotation="17.34" data-tugdeep-knee-x="-41.44" data-tugdeep-knee-y="46.77" data-tugdeep-ankle-x="-39.19" data-tugdeep-ankle-y="85.47" data-tugdeep-foot-rotation="13.00" data-tugdeep-rotation="24.64" data-danceleft-knee-x="-11.99" data-danceleft-knee-y="56.42" data-danceleft-ankle-x="-21.41" data-danceleft-ankle-y="100.75" data-danceleft-foot-rotation="0.00" data-danceleft-rotation="12.00" data-danceright-knee-x="0.00" data-danceright-knee-y="57.68" data-danceright-ankle-x="0.00" data-danceright-ankle-y="103.00" data-danceright-foot-rotation="0.00" data-danceright-rotation="0.00" data-danceopen-knee-x="-7.03" data-danceopen-knee-y="57.25" data-danceopen-ankle-x="-12.55" data-danceopen-ankle-y="102.23" data-danceopen-foot-rotation="0.00" data-danceopen-rotation="7.00" data-dancejump-knee-x="-4.02" data-dancejump-knee-y="57.54" data-dancejump-ankle-x="-7.18" data-dancejump-ankle-y="102.75" data-dancejump-foot-rotation="0.00" data-dancejump-rotation="4.00" data-wallcontact-knee-x="-12.76" data-wallcontact-knee-y="55.66" data-wallcontact-ankle-x="-13.00" data-wallcontact-ankle-y="103.00" data-wallcontact-foot-rotation="0.00" data-wallcontact-rotation="7.19" data-wallleanleft-knee-x="-27.16" data-wallleanleft-knee-y="49.66" data-wallleanleft-ankle-x="-42.19" data-wallleanleft-ankle-y="93.76" data-wallleanleft-foot-rotation="9.50" data-wallleanleft-rotation="24.22" data-walltravelright-knee-x="-20.79" data-walltravelright-knee-y="61.88" data-walltravelright-ankle-x="-18.16" data-walltravelright-ankle-y="107.97" data-walltravelright-foot-rotation="-7.50" data-walltravelright-rotation="9.54" data-walllowleft-knee-x="-41.89" data-walllowleft-knee-y="42.54" data-walllowleft-ankle-x="-52.63" data-walllowleft-ankle-y="75.98" data-walllowleft-foot-rotation="7.50" data-walllowleft-rotation="34.71" data-walllowright-knee-x="-25.48" data-walllowright-knee-y="54.43" data-walllowright-ankle-x="-15.99" data-walllowright-ankle-y="88.71" data-walllowright-foot-rotation="-6.50" data-walllowright-rotation="10.22"><g id="fr-b-mime-leg-motion-left" class="rig-leg-motion" style="--mime-leg-idle:0.00deg;--mime-leg-pull:2.63deg;--mime-leg-tug:17.34deg;--mime-leg-tugdeep:24.64deg;--mime-leg-danceleft:12.00deg;--mime-leg-danceright:0.00deg;--mime-leg-danceopen:7.00deg;--mime-leg-dancejump:4.00deg;--mime-leg-wallcontact:7.19deg;--mime-leg-wallleanleft:24.22deg;--mime-leg-walltravelright:9.54deg;--mime-leg-walllowleft:34.71deg;--mime-leg-walllowright:10.22deg" data-idle-rotation="0.00" data-pull-rotation="2.63" data-tug-rotation="17.34" data-tugdeep-rotation="24.64" data-danceleft-rotation="12.00" data-danceright-rotation="0.00" data-danceopen-rotation="7.00" data-dancejump-rotation="4.00" data-wallcontact-rotation="7.19" data-wallleanleft-rotation="24.22" data-walltravelright-rotation="9.54" data-walllowleft-rotation="34.71" data-walllowright-rotation="10.22" transform="rotate(0)"><g id="fr-b-mime-leg-bone-left" class="rig-leg-bone"><path id="fr-b-mime-leg-path-left" data-geometry="joint-landmark-catmull-sampled-variable-width-outline" data-control-policy="no-manual-bezier-handles" d="M-9.92 0.00 L-9.91 2.83 L-9.86 6.42 L-9.78 10.65 L-9.64 15.41 L-9.45 20.57 L-9.24 26.01 L-9.01 31.60 L-8.78 37.23 L-8.59 42.78 L-8.44 48.11 L-8.35 53.12 L-8.26 62.03 L-8.10 66.47 L-7.86 70.94 L-7.56 75.38 L-7.24 79.73 L-6.93 83.94 L-6.66 87.96 L-6.43 91.71 L-6.26 95.15 L-6.15 98.21 L-6.09 100.85 L-6.08 103.00 L6.08 103.00 L6.09 100.85 L6.15 98.21 L6.26 95.15 L6.43 91.71 L6.66 87.96 L6.93 83.94 L7.24 79.73 L7.56 75.38 L7.86 70.94 L8.10 66.47 L8.26 62.03 L8.35 53.12 L8.44 48.11 L8.59 42.78 L8.78 37.23 L9.01 31.60 L9.24 26.01 L9.45 20.57 L9.64 15.41 L9.78 10.65 L9.86 6.42 L9.91 2.83 L9.92 0.00 Z" fill="#252625" /></g><g id="fr-b-mime-ankle-left" class="rig-ankle-anchor" transform="translate(0.00 103.00)"><g id="fr-b-mime-foot-motion-left" class="rig-foot-motion" style="--mime-foot-idle:0.00deg;--mime-foot-pull:-2.50deg;--mime-foot-tug:9.00deg;--mime-foot-tugdeep:13.00deg;--mime-foot-danceleft:0.00deg;--mime-foot-danceright:0.00deg;--mime-foot-danceopen:0.00deg;--mime-foot-dancejump:0.00deg;--mime-foot-wallcontact:0.00deg;--mime-foot-wallleanleft:9.50deg;--mime-foot-walltravelright:-7.50deg;--mime-foot-walllowleft:7.50deg;--mime-foot-walllowright:-6.50deg" data-idle-rotation="0.00" data-pull-rotation="-2.50" data-tug-rotation="9.00" data-tugdeep-rotation="13.00" data-danceleft-rotation="0.00" data-danceright-rotation="0.00" data-danceopen-rotation="0.00" data-dancejump-rotation="0.00" data-wallcontact-rotation="0.00" data-wallleanleft-rotation="9.50" data-walltravelright-rotation="-7.50" data-walllowleft-rotation="7.50" data-walllowright-rotation="-6.50" transform="rotate(0.00)"><g id="fr-b-mime-foot-left" class="rig-foot"><rect x="-16.5" y="-8.5" width="33" height="17" rx="8.5" fill="#252625" /></g></g></g></g></g>
<g id="fr-b-mime-leg-right" class="rig-leg rig-leg-right rig-variable-leg rig-articulated-leg" transform="translate(181.00 307.00)" data-rig="variable-width-leg" data-motion="continuous-hip-knee-ankle-interpolation" data-leg-length="103.00" data-hip-radius="9.92" data-knee-radius="8.32" data-ankle-radius="6.08" data-idle-knee-x="0.00" data-idle-knee-y="57.68" data-idle-ankle-x="0.00" data-idle-ankle-y="103.00" data-idle-foot-rotation="0.00" data-idle-rotation="0.00" data-pull-knee-x="27.90" data-pull-knee-y="55.42" data-pull-ankle-x="34.14" data-pull-ankle-y="100.68" data-pull-foot-rotation="-2.50" data-pull-rotation="-18.73" data-tug-knee-x="32.21" data-tug-knee-y="65.81" data-tug-ankle-x="29.64" data-tug-ankle-y="109.18" data-tug-foot-rotation="9.00" data-tug-rotation="-15.19" data-tugdeep-knee-x="39.88" data-tugdeep-knee-y="70.58" data-tugdeep-ankle-x="34.76" data-tugdeep-ankle-y="112.24" data-tugdeep-foot-rotation="13.00" data-tugdeep-rotation="-17.21" data-danceleft-knee-x="0.00" data-danceleft-knee-y="57.68" data-danceleft-ankle-x="0.00" data-danceleft-ankle-y="103.00" data-danceleft-foot-rotation="0.00" data-danceleft-rotation="0.00" data-danceright-knee-x="11.99" data-danceright-knee-y="56.42" data-danceright-ankle-x="21.41" data-danceright-ankle-y="100.75" data-danceright-foot-rotation="0.00" data-danceright-rotation="-12.00" data-danceopen-knee-x="7.03" data-danceopen-knee-y="57.25" data-danceopen-ankle-x="12.55" data-danceopen-ankle-y="102.23" data-danceopen-foot-rotation="0.00" data-danceopen-rotation="-7.00" data-dancejump-knee-x="4.02" data-dancejump-knee-y="57.54" data-dancejump-ankle-x="7.18" data-dancejump-ankle-y="102.75" data-dancejump-foot-rotation="0.00" data-dancejump-rotation="-4.00" data-wallcontact-knee-x="12.76" data-wallcontact-knee-y="55.66" data-wallcontact-ankle-x="13.00" data-wallcontact-ankle-y="103.00" data-wallcontact-foot-rotation="0.00" data-wallcontact-rotation="-7.19" data-wallleanleft-knee-x="18.65" data-wallleanleft-knee-y="63.46" data-wallleanleft-ankle-x="14.44" data-wallleanleft-ankle-y="110.27" data-wallleanleft-foot-rotation="9.50" data-wallleanleft-rotation="-7.46" data-walltravelright-knee-x="25.46" data-walltravelright-knee-y="50.44" data-walltravelright-ankle-x="38.99" data-walltravelright-ankle-y="94.92" data-walltravelright-foot-rotation="-7.50" data-walltravelright-rotation="-22.33" data-walllowleft-knee-x="22.46" data-walllowleft-knee-y="55.30" data-walllowleft-ankle-x="10.46" data-walllowleft-ankle-y="89.81" data-walllowleft-foot-rotation="7.50" data-walllowleft-rotation="-6.64" data-walllowright-knee-x="39.08" data-walllowright-knee-y="43.17" data-walllowright-ankle-x="47.33" data-walllowright-ankle-y="76.71" data-walllowright-foot-rotation="-6.50" data-walllowright-rotation="-31.67"><g id="fr-b-mime-leg-motion-right" class="rig-leg-motion" style="--mime-leg-idle:0.00deg;--mime-leg-pull:-18.73deg;--mime-leg-tug:-15.19deg;--mime-leg-tugdeep:-17.21deg;--mime-leg-danceleft:0.00deg;--mime-leg-danceright:-12.00deg;--mime-leg-danceopen:-7.00deg;--mime-leg-dancejump:-4.00deg;--mime-leg-wallcontact:-7.19deg;--mime-leg-wallleanleft:-7.46deg;--mime-leg-walltravelright:-22.33deg;--mime-leg-walllowleft:-6.64deg;--mime-leg-walllowright:-31.67deg" data-idle-rotation="0.00" data-pull-rotation="-18.73" data-tug-rotation="-15.19" data-tugdeep-rotation="-17.21" data-danceleft-rotation="0.00" data-danceright-rotation="-12.00" data-danceopen-rotation="-7.00" data-dancejump-rotation="-4.00" data-wallcontact-rotation="-7.19" data-wallleanleft-rotation="-7.46" data-walltravelright-rotation="-22.33" data-walllowleft-rotation="-6.64" data-walllowright-rotation="-31.67" transform="rotate(0)"><g id="fr-b-mime-leg-bone-right" class="rig-leg-bone"><path id="fr-b-mime-leg-path-right" data-geometry="joint-landmark-catmull-sampled-variable-width-outline" data-control-policy="no-manual-bezier-handles" d="M-9.92 0.00 L-9.91 2.83 L-9.86 6.42 L-9.78 10.65 L-9.64 15.41 L-9.45 20.57 L-9.24 26.01 L-9.01 31.60 L-8.78 37.23 L-8.59 42.78 L-8.44 48.11 L-8.35 53.12 L-8.26 62.03 L-8.10 66.47 L-7.86 70.94 L-7.56 75.38 L-7.24 79.73 L-6.93 83.94 L-6.66 87.96 L-6.43 91.71 L-6.26 95.15 L-6.15 98.21 L-6.09 100.85 L-6.08 103.00 L6.08 103.00 L6.09 100.85 L6.15 98.21 L6.26 95.15 L6.43 91.71 L6.66 87.96 L6.93 83.94 L7.24 79.73 L7.56 75.38 L7.86 70.94 L8.10 66.47 L8.26 62.03 L8.35 53.12 L8.44 48.11 L8.59 42.78 L8.78 37.23 L9.01 31.60 L9.24 26.01 L9.45 20.57 L9.64 15.41 L9.78 10.65 L9.86 6.42 L9.91 2.83 L9.92 0.00 Z" fill="#252625" /></g><g id="fr-b-mime-ankle-right" class="rig-ankle-anchor" transform="translate(0.00 103.00)"><g id="fr-b-mime-foot-motion-right" class="rig-foot-motion" style="--mime-foot-idle:0.00deg;--mime-foot-pull:-2.50deg;--mime-foot-tug:9.00deg;--mime-foot-tugdeep:13.00deg;--mime-foot-danceleft:0.00deg;--mime-foot-danceright:0.00deg;--mime-foot-danceopen:0.00deg;--mime-foot-dancejump:0.00deg;--mime-foot-wallcontact:0.00deg;--mime-foot-wallleanleft:9.50deg;--mime-foot-walltravelright:-7.50deg;--mime-foot-walllowleft:7.50deg;--mime-foot-walllowright:-6.50deg" data-idle-rotation="0.00" data-pull-rotation="-2.50" data-tug-rotation="9.00" data-tugdeep-rotation="13.00" data-danceleft-rotation="0.00" data-danceright-rotation="0.00" data-danceopen-rotation="0.00" data-dancejump-rotation="0.00" data-wallcontact-rotation="0.00" data-wallleanleft-rotation="9.50" data-walltravelright-rotation="-7.50" data-walllowleft-rotation="7.50" data-walllowright-rotation="-6.50" transform="rotate(0.00)"><g id="fr-b-mime-foot-right" class="rig-foot"><rect x="-16.5" y="-8.5" width="33" height="17" rx="8.5" fill="#252625" /></g></g></g></g></g>
<g id="fr-b-mime-body" class="rig-body" data-layer-role="tall-thin-avatar-torso-base"><path id="fr-b-mime-torso-silhouette" data-shape-system="duolingo-tall-thin-avatar-block" data-construction="high-narrow-rounded-rectangle" data-center-x="160" data-shoulder-half-width="45" data-hip-half-width="45" data-top-y="182" data-bottom-y="314" data-head-overlap="18" data-height-width-ratio="1.47" d="M133.90 182.00 H186.10 A18.90 18.90 0 0 1 205.00 200.90 L205.00 295.10 A18.90 18.90 0 0 1 186.10 314.00 H133.90 A18.90 18.90 0 0 1 115.00 295.10 L115.00 200.90 A18.90 18.90 0 0 1 133.90 182.00 Z" fill="#252625" /><g id="fr-b-mime-shirt-stripes" class="rig-shirt-stripes"><path id="fr-b-mime-stripe-top" d="M115 235 H205 V251 H115 Z" fill="#fdf3d6" /><path id="fr-b-mime-stripe-bottom" d="M115 274 H205 V290 H115 Z" fill="#fdf3d6" /></g></g>
<g id="fr-b-mime-arm-right" data-wall-forearm-policy="wrist-contact-preserved-minimum-forearm-length" data-wall-forearm-min-length="34.00" data-dancejump-hand-art="lucy-raised" data-danceopen-hand-art="lin-right" data-danceright-hand-art="lin-right" data-danceleft-hand-art="lucy-low" class="rig-arm rig-arm-right rig-articulated-arm" data-rig="landmark-derived-variable-width" data-motion="continuous-shoulder-elbow-wrist-interpolation" data-layer-role="independent-foreground-limb" data-shoulder-x="197.00" data-shoulder-y="204.00" data-shoulder-radius="9.60" data-elbow-radius="8.64" data-wrist-radius="6.72" data-band-length="17.00" data-band-overlap="0.00" data-idle-elbow-x="209.00" data-idle-elbow-y="260.00" data-idle-wrist-x="213.00" data-idle-wrist-y="319.00" data-idle-hand-pose="0.00" data-idle-hand-scale="1.000" data-idle-hand-rotation-offset="0.00" data-pull-elbow-x="225.00" data-pull-elbow-y="236.00" data-pull-wrist-x="286.00" data-pull-wrist-y="204.00" data-pull-hand-pose="1.00" data-pull-hand-scale="1.000" data-pull-hand-rotation-offset="0.00" data-tug-elbow-x="215.00" data-tug-elbow-y="244.00" data-tug-wrist-x="242.00" data-tug-wrist-y="233.00" data-tug-hand-pose="1.00" data-tug-hand-scale="1.000" data-tug-hand-rotation-offset="0.00" data-tugdeep-elbow-x="207.00" data-tugdeep-elbow-y="249.00" data-tugdeep-wrist-x="228.00" data-tugdeep-wrist-y="242.00" data-tugdeep-hand-pose="1.00" data-tugdeep-hand-scale="1.000" data-tugdeep-hand-rotation-offset="0.00" data-danceleft-elbow-x="224.00" data-danceleft-elbow-y="246.00" data-danceleft-wrist-x="248.00" data-danceleft-wrist-y="288.00" data-danceleft-hand-pose="0.00" data-danceleft-hand-scale="1.000" data-danceleft-hand-rotation-offset="0.00" data-danceright-elbow-x="229.00" data-danceright-elbow-y="242.00" data-danceright-wrist-x="259.00" data-danceright-wrist-y="214.00" data-danceright-hand-pose="0.00" data-danceright-hand-scale="1.000" data-danceright-hand-rotation-offset="0.00" data-danceopen-elbow-x="231.00" data-danceopen-elbow-y="234.00" data-danceopen-wrist-x="266.00" data-danceopen-wrist-y="220.00" data-danceopen-hand-pose="0.00" data-danceopen-hand-scale="1.000" data-danceopen-hand-rotation-offset="0.00" data-dancejump-elbow-x="229.00" data-dancejump-elbow-y="175.00" data-dancejump-wrist-x="245.00" data-dancejump-wrist-y="132.00" data-dancejump-hand-pose="0.00" data-dancejump-hand-scale="1.000" data-dancejump-hand-rotation-offset="0.00" data-wallcontact-elbow-x="234.36" data-wallcontact-elbow-y="198.45" data-wallcontact-wrist-x="266.00" data-wallcontact-wrist-y="186.00" data-wallcontact-hand-pose="0.52" data-wallcontact-hand-scale="1.450" data-wallcontact-hand-rotation-offset="21.47" data-wallleanleft-elbow-x="259.08" data-wallleanleft-elbow-y="209.35" data-wallleanleft-wrist-x="303.43" data-wallleanleft-wrist-y="208.22" data-wallleanleft-hand-pose="0.52" data-wallleanleft-hand-scale="1.450" data-wallleanleft-hand-rotation-offset="10.96" data-walltravelright-elbow-x="224.27" data-walltravelright-elbow-y="193.95" data-walltravelright-wrist-x="250.24" data-walltravelright-wrist-y="172.01" data-walltravelright-hand-pose="0.52" data-walltravelright-hand-scale="1.450" data-walltravelright-hand-rotation-offset="32.71" data-walllowleft-elbow-x="223.33" data-walllowleft-elbow-y="226.50" data-walllowleft-wrist-x="240.26" data-walllowleft-wrist-y="255.98" data-walllowleft-hand-pose="0.52" data-walllowleft-hand-scale="1.500" data-walllowleft-hand-rotation-offset="-52.62" data-walllowright-elbow-x="219.65" data-walllowright-elbow-y="210.90" data-walllowright-wrist-x="243.60" data-walllowright-wrist-y="235.03" data-walllowright-hand-pose="0.52" data-walllowright-hand-scale="1.500" data-walllowright-hand-rotation-offset="-51.72"><path id="fr-b-mime-arm-sleeve-right" class="rig-arm-sleeve" data-geometry="joint-landmark-catmull-sampled-variable-width-outline" data-control-policy="no-manual-bezier-handles" d="M187.63 206.10 L188.26 208.85 L189.09 212.28 L190.09 216.22 L191.23 220.61 L192.47 225.36 L193.78 230.39 L195.10 235.60 L196.41 240.91 L197.64 246.22 L198.75 251.44 L199.68 256.35 L201.09 266.08 L201.73 271.14 L202.39 276.58 L203.04 282.18 L203.67 287.82 L204.25 293.40 L204.78 298.80 L205.22 303.91 L205.59 308.63 L205.88 312.86 L206.11 316.50 L206.29 319.39 L219.71 318.61 L219.56 315.78 L219.43 312.23 L219.35 308.02 L219.30 303.27 L219.27 298.10 L219.25 292.60 L219.20 286.90 L219.11 281.08 L218.92 275.26 L218.62 269.55 L218.16 263.92 L216.80 253.75 L215.90 248.25 L214.93 242.74 L213.89 237.17 L212.82 231.64 L211.72 226.24 L210.64 221.06 L209.59 216.21 L208.60 211.77 L207.71 207.84 L206.95 204.54 L206.37 201.90 Z" fill="#252625" /><path id="fr-b-mime-sleeve-band-right" class="rig-sleeve-band" data-geometry="forearm-derived-tapered-cuff" d="M204.00 302.57 L205.70 319.50 L220.30 318.50 L219.70 301.51 Z" fill="#fdf3d6" /><g id="fr-b-mime-elbow-right" class="rig-elbow-anchor" transform="translate(209.00 260.00)" /><g id="fr-b-mime-hand-right" class="rig-hand rig-hand-right" data-orientation="forearm-derived" transform="translate(213.00 319.00) rotate(86.12)"><g id="fr-b-mime-hand-right-shape" data-dance-art-selection="one-visible-silhouette-per-keyframe" class="rig-hand-shape rig-hand-continuous" data-hand-design="official-duolingo-source-contour-plus-pose-specific-dance-fists" data-hand-role="lead-grip" data-hand-pose="0.00" data-deformation="vector-pose-crossfade"><g id="fr-b-mime-hand-right-pose-idle" class="rig-hand-pose-art rig-hand-pose-idle" data-pose="idle" data-source="official-duolingo-lucy-compact-hand-contour" opacity="1.000"><g transform="rotate(22) scale(.286) translate(-50 -130)"><path id="fr-b-mime-hand-right-idle-silhouette" class="rig-hand-silhouette" d="M110.321 83.634c9.401 6.52 13.84 14.34 16.68 25.366 1.548 4.945 3.364 7.801 7.596 10.86 2.672 2.172 3.696 4.398 4.215 7.765.486 4.887-.505 9.048-2.812 13.375-2.98 3.337-6.183 5.88-10.73 6.181q-1.76.045-3.52.075l-1.943.044c-5.92.126-11.843.195-17.764.248-3.976.036-7.949.09-11.924.186-3.848.093-7.693.141-11.542.16q-2.193.02-4.384.088c-11.997.357-11.997.357-15.852-2.929-2.098-2.148-3.759-4.5-5.34-7.053l-1.136-1.815C50.441 133.62 50 131.965 50 129l-3 1c-.359-16.026.46-29.488 11.778-41.944C62.368 84.366 66.325 82.06 71 80l2.043-.965c12.468-5.076 26.276-2.543 37.278 4.6" fill="#faf9f9" data-geometry="official-duolingo-automatic-vector-trace" data-control-policy="automatic-trace-not-manual-handles" /></g></g><g id="fr-b-mime-hand-right-pose-reach" class="rig-hand-pose-art rig-hand-pose-reach" data-pose="reach" data-source="official-duolingo-eddy-open-hand-contour" opacity="0.000"><g transform="scale(.195) translate(-101 -153)"><path id="fr-b-mime-hand-right-reach-silhouette" class="rig-hand-silhouette" d="M138.813 80.188c3.828 3.171 6.752 6.362 7.393 11.438l.11 1.73.127 1.885c.04.641.078 1.284.12 1.947l.13 1.981q.158 2.415.307 4.83l1.41-.496c5.607-1.919 9.9-1.754 15.278.746 4.06 3.075 6.363 5.496 7.129 10.68.572 6.078-1.281 11.38-3.13 17.07a972 972 0 0 0-1.456 4.677 485 485 0 0 1-1.346 4.241c-2.087 7.018-3.163 13.602-3.123 20.922a2746 2746 0 0 1-.049 4.971 858 858 0 0 0-.018 7.694c.013 12.284-.444 20.927-9.07 30.371-7.514 6.927-14.494 8.18-24.438 8.688l-2.389.13q-2.898.157-5.797.306c.328-1.319.659-2.638 1-4-.75-.105-1.499-.21-2.27-.32-8.322-2.07-15.226-12.441-20.73-18.68-.317-.35-.317-.35-1.912-2.131A430 430 0 0 1 91 183l-2.172-2.398c-3.954-4.484-6.924-8.328-7.067-14.566.534-4.553 2.304-7.442 5.802-10.349 3.365-2.329 5.02-2.808 9.061-2.75.819.01 1.636.018 2.478.027L101 153l-.303-1.315q-1.562-6.764-3.114-13.529-.582-2.526-1.166-5.052-.837-3.626-1.666-7.253c-.089-.377-.089-.377-.532-2.288l-.484-2.123-.431-1.87C93 118 93 118 93 116l-2-1c.936-11.823.936-11.823 5.436-15.688 3.782-2.767 7.005-3.642 11.645-3.612 3.41.534 6.104 2.383 8.919 4.3-.048-.725-.094-1.448-.142-2.195-.353-9.486-.353-9.486 3.063-13.66L121 83c.514-.599 1.03-1.197 1.561-1.813 4.064-3.356 11.709-3.504 16.25-1" fill="#faf9f9" data-geometry="official-duolingo-automatic-vector-trace" data-control-policy="automatic-trace-not-manual-handles" /></g></g><g id="fr-b-mime-hand-right-pose-grip" class="rig-hand-pose-art rig-hand-pose-grip" data-pose="grip" data-source="official-duolingo-oscar-curled-finger-contour" opacity="0.000"><g transform="rotate(14) scale(.0975) translate(-70 -170)"><path id="fr-b-mime-hand-right-grip-silhouette" class="rig-hand-silhouette" d="M192 70c1.787 1.439 2.511 2.006 4.824 1.977l1.864-.352 1.886-.336L202 71l-1.02 1.207c-1.305 2.388-1.017 3.8-.668 6.481l.329 2.695q.324 2.367.656 4.734c2.403 17.603-2.083 33.548-12.735 47.758-3.085 3.743-6.457 7.148-9.96 10.496-2.235 2.273-2.578 3.348-2.852 6.567.05 2.258.216 3.006 1.438 5C179 157 179 157 181.371 156.758c9.438-2.721 16.846-14.219 21.817-22.196l.972-1.555c9.511-15.754 13.306-34.683 9.008-52.679a203 203 0 0 0-.98-3.516l-.463-1.603c-1.224-3.72-2.856-5.689-5.725-8.209 8.204-3.023 15.663-4.267 24.375-3.812l2.091.091c4.105.286 6.382.888 9.534 3.721a88 88 0 0 0 5 2v2l1.625.625c2.314 1.34 3.49 2.536 5.25 4.5 2.628 2.762 2.628 2.762 4.844 3.266 1.656-.016 1.656-.016 4.281-.391l-1.493 1.075c-2.226 2.843-1.794 5.226-1.624 8.726l.097 4.154q.101 3.241.232 6.482c.756 19.738-6.663 33.721-19.212 48.563l-1.621 1.75c-2.274 2.473-3.671 4.05-3.754 7.5C236 160 236 160 237 162c3.375.664 5.962.619 8.965-1.172 14.372-11.953 24.661-31.573 26.723-49.945 1.007-11.028.973-22.096-1.688-32.883h-5l1-2q4.562-.112 9.125-.165 1.55-.022 3.098-.061c10.393-.256 10.393-.256 14.777 3.226l2.312.812C302.776 82.668 307.579 86.878 311 93l1.024 1.62c3.542 6.099 3.685 11.914 3.601 18.755l-.005 1.725c-.103 15.516-4.887 30.243-13.995 42.9l-.91 1.267q-.915 1.269-1.839 2.532a322 322 0 0 0-2.415 3.369c-4.421 6.112-9.283 11.739-15.742 15.742-1.797 1.139-3.519 2.365-5.246 3.607-7.371 5.278-14.851 9.59-23.473 12.483q-1.555.593-3.109 1.188c-10.039 3.644-19.996 4.858-30.574 5.736-6.673.58-11.721 1.319-17.192 5.514-6.173 4.539-13.398 6.87-20.647 9.096-1.329.419-2.643.881-3.955 1.349-14.956 4.89-32.225 3.781-47.523 1.117l-1.926-.331C111.923 217.856 97.631 209.952 86 200l-2.176-1.527C76.722 193.456 71.988 187.036 67 180l-.941-1.29c-4.158-5.726-4.158-5.726-3.817-9.116C64.146 163.077 67.464 157.036 72 152l1.383-1.758c9.429-11.616 23.868-21.269 38.722-23.859 4.647-.939 9.229-3.378 11.895-7.383 4.248-8.513 6.314-17.862 7.875-27.188 1.013-5.259 3.309-9.31 6.125-13.812l.828-1.648c3.342-6.193 11.276-10.694 17.86-12.727A78 78 0 0 1 160 63l1.676-.398C172.66 60.485 183.477 62.936 192 70" fill="#faf9f9" data-geometry="official-duolingo-automatic-vector-trace" data-control-policy="automatic-trace-not-manual-handles" /><g class="rig-hand-grip-detail" fill="#d7d4d2"><path class="rig-hand-knuckle-mark rig-hand-knuckle-mark-1" d="M207.602 69.191c2.854 1.65 3.473 4.8 4.398 7.81 4.616 19.004 2.143 38.601-8.043 55.405-3.855 6.216-7.77 12.392-12.957 17.594l-1.453 1.488c-3.154 2.947-5.75 4.134-10.031 4.664C178 156 178 156 176 154c-.77-4.886-.77-4.886.927-7.342 1.324-1.356 2.705-2.603 4.136-3.846C188.936 135.47 194.19 127.106 198 117l.552-1.38c2.67-6.804 3.807-13.112 3.823-20.433l.005-2.1c-.092-4.309-.757-8.21-1.906-12.363-.684-2.49-1.025-4.172-.474-6.724 4.433-5.188 4.433-5.188 7.602-4.809" /><path class="rig-hand-knuckle-mark rig-hand-knuckle-mark-2" d="M271 78c4.117 10.275 2.414 24.575 1.188 35.312l-.213 1.994c-.589 4.651-1.986 8.47-3.975 12.694a351 351 0 0 0-1.375 3.375c-1.874 4.383-4.213 8.518-6.625 12.625l-1.027 1.766L258 147h-2l-.707 2.168c-1.339 3.327-3.49 5.616-5.981 8.144l-1.24 1.377c-1.908 1.95-3.214 3.179-5.965 3.602A41 41 0 0 1 237 162c-1.353-2.707-1.63-5.07-1-8 1.76-2.819 4.041-5.081 6.43-7.371 8.688-9.012 15.506-21.22 17.57-33.629l.332-1.84c1.375-8.964.859-18.031-.309-26.98L260 82c1.881-1.881 2.548-2.359 4.938-3.125l1.527-.508C268 78 268 78 271 78" /></g></g></g><g id="fr-b-mime-hand-right-dance-lucy-raised" opacity="0" data-control-policy="automatic-trace-not-manual-handles" data-geometry="flat-fill-connected-component-automatic-spline-vector-trace" data-source="official-duolingo-lucy-oscar-lin-dancing-2" data-art="lucy-raised" class="rig-hand-dance-art rig-hand-dance-lucy-raised"><g transform="rotate(97.646) scale(0.404925) translate(-67.5 -95.514)"><path id="fr-b-mime-hand-right-dance-lucy-raised-silhouette" fill="#eee9e2" d="M83.688 26.688C91.18 31.83 97.554 39.117 100 48a99 99 0 0 1 .623 3.937c.843 5.851.843 5.851 2.947 7.63 1.21.86 2.473 1.617 3.746 2.378 2.93 1.836 4.107 3.806 4.958 7.122 1.229 5.6 1.125 10.257-1.993 15.175-2.258 3.198-4.551 6.13-8.514 7.042-3.239.49-6.498.606-9.767.716-4.357.206-7.282.98-10.875 3.375-9.232 6.1-19.96 7.322-30.794 5.316-10.334-2.588-19.29-9.753-24.972-18.7-1.124-1.943-2.066-3.94-2.937-6.009-.414-.963-.866-1.9-1.328-2.841-4.184-9.018-2.592-18.996.625-28.07C23.318 40.997 25.623 35.93 29 33h2l.258-1.316c2.19-4.97 9.999-8.126 14.805-10.059 12.663-4.573 26.482-1.985 37.625 5.063" class="rig-hand-silhouette rig-hand-dance-silhouette" /></g></g><g id="fr-b-mime-hand-right-dance-lucy-low" opacity="0" data-control-policy="automatic-trace-not-manual-handles" data-geometry="flat-fill-connected-component-automatic-spline-vector-trace" data-source="official-duolingo-lucy-oscar-lin-dancing-2" data-art="lucy-low" class="rig-hand-dance-art rig-hand-dance-lucy-low"><g transform="rotate(177.636) scale(0.421674) translate(-98.453 -60)"><path id="fr-b-mime-hand-right-dance-lucy-low-silhouette" fill="#eee9e2" d="M82.111 24.633c2.52 1.55 4.727 3.355 6.889 5.367l1.035.957c8.268 7.875 12.733 17.717 13.031 29.168-.091 11.889-5.205 22.194-13.472 30.61-7.248 6.741-18.088 10.687-27.962 10.564-11.748-.574-22.532-5.31-30.507-14.049-5.634-6.626-9.378-15.539-9.152-24.242l.037-2.887q.036-2.244.086-4.489c.206-9.83.206-9.83-1.658-14.437-1.08-2.948-.352-6.264.562-9.195 2.119-4.573 5.702-8.575 10.383-10.598 2.014-.5 3.863-.55 5.93-.527l1.208.002c2.283.026 4.369.242 6.604.748 2.35.474 3.842.187 6.102-.578 10.292-3.102 21.6-1.704 30.884 3.586" class="rig-hand-silhouette rig-hand-dance-silhouette" /></g></g><g id="fr-b-mime-hand-right-dance-lin-right" opacity="0" data-control-policy="automatic-trace-not-manual-handles" data-geometry="flat-fill-connected-component-automatic-spline-vector-trace" data-source="official-duolingo-lucy-oscar-lin-dancing-2" data-art="lin-right" class="rig-hand-dance-art rig-hand-dance-lin-right"><g transform="rotate(69.032) scale(0.420215) translate(-43.563 -97.656)"><path id="fr-b-mime-hand-right-dance-lin-right-silhouette" fill="#eee9e2" d="M70.002 20.562C72.274 22.242 74.055 24.315 75 27c.166 1.853.03 3.65-.125 5.5-.382 4.709-.382 4.709.787 6.532 1.567 1.618 3.367 2.894 5.17 4.234C86.744 47.72 90.807 55.768 92 63c1.166 9.616.008 18.89-5.988 26.73-3.273 3.962-6.875 7.533-11.2 10.333l-.897.581c-7.018 4.045-19.165 3.623-26.763 1.778-8.986-2.819-16.448-10.156-20.796-18.327-2.537-5.169-2.616-10.378-2.757-16.026-.12-4.444-.692-7.843-2.918-11.8-1.455-2.71-1.373-5.336-.681-8.269 1.615-3.136 3.507-5.29 6.715-6.816 4.284-1.341 4.284-1.341 6.413-1.007 1.454.193 2.445.196 3.872-.177 1.925-1.523 3.472-3.284 5.05-5.158 1.282-1.52 2.611-3 3.934-4.487.26-.292.518-.585.785-.887a73.5 73.5 0 0 1 6.794-6.718l.938-.832c4.239-3.602 10.564-4.124 15.501-1.356" class="rig-hand-silhouette rig-hand-dance-silhouette" /></g></g></g></g></g>
<g id="fr-b-mime-arm-left" data-wall-forearm-policy="wrist-contact-preserved-minimum-forearm-length" data-wall-forearm-min-length="34.00" data-dancejump-hand-art="lucy-raised" data-danceopen-hand-art="lin-right" data-danceright-hand-art="lucy-low" data-danceleft-hand-art="lin-right" class="rig-arm rig-arm-left rig-articulated-arm" data-rig="landmark-derived-variable-width" data-motion="continuous-shoulder-elbow-wrist-interpolation" data-layer-role="independent-foreground-limb" data-shoulder-x="123.00" data-shoulder-y="204.00" data-shoulder-radius="9.60" data-elbow-radius="8.64" data-wrist-radius="6.72" data-band-length="17.00" data-band-overlap="0.00" data-idle-elbow-x="111.00" data-idle-elbow-y="260.00" data-idle-wrist-x="107.00" data-idle-wrist-y="319.00" data-idle-hand-pose="0.00" data-idle-hand-scale="1.000" data-idle-hand-rotation-offset="0.00" data-pull-elbow-x="160.00" data-pull-elbow-y="232.00" data-pull-wrist-x="237.00" data-pull-wrist-y="216.00" data-pull-hand-pose="1.00" data-pull-hand-scale="1.000" data-pull-hand-rotation-offset="0.00" data-tug-elbow-x="146.00" data-tug-elbow-y="242.00" data-tug-wrist-x="198.00" data-tug-wrist-y="249.00" data-tug-hand-pose="1.00" data-tug-hand-scale="1.000" data-tug-hand-rotation-offset="0.00" data-tugdeep-elbow-x="140.00" data-tugdeep-elbow-y="250.00" data-tugdeep-wrist-x="186.00" data-tugdeep-wrist-y="260.00" data-tugdeep-hand-pose="1.00" data-tugdeep-hand-scale="1.000" data-tugdeep-hand-rotation-offset="0.00" data-danceleft-elbow-x="91.00" data-danceleft-elbow-y="242.00" data-danceleft-wrist-x="61.00" data-danceleft-wrist-y="214.00" data-danceleft-hand-pose="0.00" data-danceleft-hand-scale="1.000" data-danceleft-hand-rotation-offset="0.00" data-danceright-elbow-x="96.00" data-danceright-elbow-y="246.00" data-danceright-wrist-x="72.00" data-danceright-wrist-y="288.00" data-danceright-hand-pose="0.00" data-danceright-hand-scale="1.000" data-danceright-hand-rotation-offset="0.00" data-danceopen-elbow-x="89.00" data-danceopen-elbow-y="234.00" data-danceopen-wrist-x="54.00" data-danceopen-wrist-y="220.00" data-danceopen-hand-pose="0.00" data-danceopen-hand-scale="1.000" data-danceopen-hand-rotation-offset="0.00" data-dancejump-elbow-x="91.00" data-dancejump-elbow-y="175.00" data-dancejump-wrist-x="75.00" data-dancejump-wrist-y="132.00" data-dancejump-hand-pose="0.00" data-dancejump-hand-scale="1.000" data-dancejump-hand-rotation-offset="0.00" data-wallcontact-elbow-x="85.64" data-wallcontact-elbow-y="198.45" data-wallcontact-wrist-x="54.00" data-wallcontact-wrist-y="186.00" data-wallcontact-hand-pose="0.52" data-wallcontact-hand-scale="1.450" data-wallcontact-hand-rotation-offset="-21.47" data-wallleanleft-elbow-x="110.34" data-wallleanleft-elbow-y="203.22" data-wallleanleft-wrist-x="94.33" data-wallleanleft-wrist-y="173.23" data-wallleanleft-hand-pose="0.52" data-wallleanleft-hand-scale="1.450" data-wallleanleft-hand-rotation-offset="-52.40" data-walltravelright-elbow-x="73.73" data-walltravelright-elbow-y="204.58" data-walltravelright-wrist-x="40.05" data-walltravelright-wrist-y="199.68" data-walltravelright-hand-pose="0.52" data-walltravelright-hand-scale="1.450" data-walltravelright-hand-rotation-offset="-15.78" data-walllowleft-elbow-x="98.74" data-walllowleft-elbow-y="211.05" data-walllowleft-wrist-x="73.70" data-walllowleft-wrist-y="234.05" data-walllowleft-hand-pose="0.52" data-walllowleft-hand-scale="1.500" data-walllowleft-hand-rotation-offset="-309.93" data-walllowright-elbow-x="95.20" data-walllowright-elbow-y="225.54" data-walllowright-wrist-x="76.68" data-walllowright-wrist-y="254.05" data-walllowright-hand-pose="0.52" data-walllowright-hand-scale="1.500" data-walllowright-hand-rotation-offset="-309.52"><path id="fr-b-mime-arm-sleeve-left" class="rig-arm-sleeve" data-geometry="joint-landmark-catmull-sampled-variable-width-outline" data-control-policy="no-manual-bezier-handles" d="M113.63 201.90 L113.05 204.54 L112.29 207.84 L111.40 211.77 L110.41 216.21 L109.36 221.06 L108.28 226.24 L107.18 231.64 L106.11 237.17 L105.07 242.74 L104.10 248.25 L103.20 253.75 L101.84 263.92 L101.38 269.55 L101.08 275.26 L100.89 281.08 L100.80 286.90 L100.75 292.60 L100.73 298.10 L100.70 303.27 L100.65 308.02 L100.57 312.23 L100.44 315.78 L100.29 318.61 L113.71 319.39 L113.89 316.50 L114.12 312.86 L114.41 308.63 L114.78 303.91 L115.22 298.80 L115.75 293.40 L116.33 287.82 L116.96 282.18 L117.61 276.58 L118.27 271.14 L118.91 266.08 L120.32 256.35 L121.25 251.44 L122.36 246.22 L123.59 240.91 L124.90 235.60 L126.22 230.39 L127.53 225.36 L128.77 220.61 L129.91 216.22 L130.91 212.28 L131.74 208.85 L132.37 206.10 Z" fill="#252625" /><path id="fr-b-mime-sleeve-band-left" class="rig-sleeve-band" data-geometry="forearm-derived-tapered-cuff" d="M100.30 301.51 L99.70 318.50 L114.30 319.50 L116.00 302.57 Z" fill="#fdf3d6" /><g id="fr-b-mime-elbow-left" class="rig-elbow-anchor" transform="translate(111.00 260.00)" /><g id="fr-b-mime-hand-left" class="rig-hand rig-hand-left" data-orientation="forearm-derived" transform="translate(107.00 319.00) rotate(93.88)"><g id="fr-b-mime-hand-left-shape" data-dance-art-selection="one-visible-silhouette-per-keyframe" class="rig-hand-shape rig-hand-continuous" data-hand-design="official-duolingo-source-contour-plus-pose-specific-dance-fists" data-hand-role="anchor-grip" data-hand-pose="0.00" data-deformation="vector-pose-crossfade" transform="scale(1 -1)"><g id="fr-b-mime-hand-left-pose-idle" class="rig-hand-pose-art rig-hand-pose-idle" data-pose="idle" data-source="official-duolingo-lucy-compact-hand-contour" opacity="1.000"><g transform="rotate(22) scale(.286) translate(-50 -130)"><path id="fr-b-mime-hand-left-idle-silhouette" class="rig-hand-silhouette" d="M110.321 83.634c9.401 6.52 13.84 14.34 16.68 25.366 1.548 4.945 3.364 7.801 7.596 10.86 2.672 2.172 3.696 4.398 4.215 7.765.486 4.887-.505 9.048-2.812 13.375-2.98 3.337-6.183 5.88-10.73 6.181q-1.76.045-3.52.075l-1.943.044c-5.92.126-11.843.195-17.764.248-3.976.036-7.949.09-11.924.186-3.848.093-7.693.141-11.542.16q-2.193.02-4.384.088c-11.997.357-11.997.357-15.852-2.929-2.098-2.148-3.759-4.5-5.34-7.053l-1.136-1.815C50.441 133.62 50 131.965 50 129l-3 1c-.359-16.026.46-29.488 11.778-41.944C62.368 84.366 66.325 82.06 71 80l2.043-.965c12.468-5.076 26.276-2.543 37.278 4.6" fill="#faf9f9" data-geometry="official-duolingo-automatic-vector-trace" data-control-policy="automatic-trace-not-manual-handles" /></g></g><g id="fr-b-mime-hand-left-pose-reach" class="rig-hand-pose-art rig-hand-pose-reach" data-pose="reach" data-source="official-duolingo-eddy-open-hand-contour" opacity="0.000"><g transform="scale(.195) translate(-101 -153)"><path id="fr-b-mime-hand-left-reach-silhouette" class="rig-hand-silhouette" d="M138.813 80.188c3.828 3.171 6.752 6.362 7.393 11.438l.11 1.73.127 1.885c.04.641.078 1.284.12 1.947l.13 1.981q.158 2.415.307 4.83l1.41-.496c5.607-1.919 9.9-1.754 15.278.746 4.06 3.075 6.363 5.496 7.129 10.68.572 6.078-1.281 11.38-3.13 17.07a972 972 0 0 0-1.456 4.677 485 485 0 0 1-1.346 4.241c-2.087 7.018-3.163 13.602-3.123 20.922a2746 2746 0 0 1-.049 4.971 858 858 0 0 0-.018 7.694c.013 12.284-.444 20.927-9.07 30.371-7.514 6.927-14.494 8.18-24.438 8.688l-2.389.13q-2.898.157-5.797.306c.328-1.319.659-2.638 1-4-.75-.105-1.499-.21-2.27-.32-8.322-2.07-15.226-12.441-20.73-18.68-.317-.35-.317-.35-1.912-2.131A430 430 0 0 1 91 183l-2.172-2.398c-3.954-4.484-6.924-8.328-7.067-14.566.534-4.553 2.304-7.442 5.802-10.349 3.365-2.329 5.02-2.808 9.061-2.75.819.01 1.636.018 2.478.027L101 153l-.303-1.315q-1.562-6.764-3.114-13.529-.582-2.526-1.166-5.052-.837-3.626-1.666-7.253c-.089-.377-.089-.377-.532-2.288l-.484-2.123-.431-1.87C93 118 93 118 93 116l-2-1c.936-11.823.936-11.823 5.436-15.688 3.782-2.767 7.005-3.642 11.645-3.612 3.41.534 6.104 2.383 8.919 4.3-.048-.725-.094-1.448-.142-2.195-.353-9.486-.353-9.486 3.063-13.66L121 83c.514-.599 1.03-1.197 1.561-1.813 4.064-3.356 11.709-3.504 16.25-1" fill="#faf9f9" data-geometry="official-duolingo-automatic-vector-trace" data-control-policy="automatic-trace-not-manual-handles" /></g></g><g id="fr-b-mime-hand-left-pose-grip" class="rig-hand-pose-art rig-hand-pose-grip" data-pose="grip" data-source="official-duolingo-oscar-curled-finger-contour" opacity="0.000"><g transform="rotate(14) scale(.0975) translate(-70 -170)"><path id="fr-b-mime-hand-left-grip-silhouette" class="rig-hand-silhouette" d="M192 70c1.787 1.439 2.511 2.006 4.824 1.977l1.864-.352 1.886-.336L202 71l-1.02 1.207c-1.305 2.388-1.017 3.8-.668 6.481l.329 2.695q.324 2.367.656 4.734c2.403 17.603-2.083 33.548-12.735 47.758-3.085 3.743-6.457 7.148-9.96 10.496-2.235 2.273-2.578 3.348-2.852 6.567.05 2.258.216 3.006 1.438 5C179 157 179 157 181.371 156.758c9.438-2.721 16.846-14.219 21.817-22.196l.972-1.555c9.511-15.754 13.306-34.683 9.008-52.679a203 203 0 0 0-.98-3.516l-.463-1.603c-1.224-3.72-2.856-5.689-5.725-8.209 8.204-3.023 15.663-4.267 24.375-3.812l2.091.091c4.105.286 6.382.888 9.534 3.721a88 88 0 0 0 5 2v2l1.625.625c2.314 1.34 3.49 2.536 5.25 4.5 2.628 2.762 2.628 2.762 4.844 3.266 1.656-.016 1.656-.016 4.281-.391l-1.493 1.075c-2.226 2.843-1.794 5.226-1.624 8.726l.097 4.154q.101 3.241.232 6.482c.756 19.738-6.663 33.721-19.212 48.563l-1.621 1.75c-2.274 2.473-3.671 4.05-3.754 7.5C236 160 236 160 237 162c3.375.664 5.962.619 8.965-1.172 14.372-11.953 24.661-31.573 26.723-49.945 1.007-11.028.973-22.096-1.688-32.883h-5l1-2q4.562-.112 9.125-.165 1.55-.022 3.098-.061c10.393-.256 10.393-.256 14.777 3.226l2.312.812C302.776 82.668 307.579 86.878 311 93l1.024 1.62c3.542 6.099 3.685 11.914 3.601 18.755l-.005 1.725c-.103 15.516-4.887 30.243-13.995 42.9l-.91 1.267q-.915 1.269-1.839 2.532a322 322 0 0 0-2.415 3.369c-4.421 6.112-9.283 11.739-15.742 15.742-1.797 1.139-3.519 2.365-5.246 3.607-7.371 5.278-14.851 9.59-23.473 12.483q-1.555.593-3.109 1.188c-10.039 3.644-19.996 4.858-30.574 5.736-6.673.58-11.721 1.319-17.192 5.514-6.173 4.539-13.398 6.87-20.647 9.096-1.329.419-2.643.881-3.955 1.349-14.956 4.89-32.225 3.781-47.523 1.117l-1.926-.331C111.923 217.856 97.631 209.952 86 200l-2.176-1.527C76.722 193.456 71.988 187.036 67 180l-.941-1.29c-4.158-5.726-4.158-5.726-3.817-9.116C64.146 163.077 67.464 157.036 72 152l1.383-1.758c9.429-11.616 23.868-21.269 38.722-23.859 4.647-.939 9.229-3.378 11.895-7.383 4.248-8.513 6.314-17.862 7.875-27.188 1.013-5.259 3.309-9.31 6.125-13.812l.828-1.648c3.342-6.193 11.276-10.694 17.86-12.727A78 78 0 0 1 160 63l1.676-.398C172.66 60.485 183.477 62.936 192 70" fill="#faf9f9" data-geometry="official-duolingo-automatic-vector-trace" data-control-policy="automatic-trace-not-manual-handles" /><g class="rig-hand-grip-detail" fill="#d7d4d2"><path class="rig-hand-knuckle-mark rig-hand-knuckle-mark-1" d="M207.602 69.191c2.854 1.65 3.473 4.8 4.398 7.81 4.616 19.004 2.143 38.601-8.043 55.405-3.855 6.216-7.77 12.392-12.957 17.594l-1.453 1.488c-3.154 2.947-5.75 4.134-10.031 4.664C178 156 178 156 176 154c-.77-4.886-.77-4.886.927-7.342 1.324-1.356 2.705-2.603 4.136-3.846C188.936 135.47 194.19 127.106 198 117l.552-1.38c2.67-6.804 3.807-13.112 3.823-20.433l.005-2.1c-.092-4.309-.757-8.21-1.906-12.363-.684-2.49-1.025-4.172-.474-6.724 4.433-5.188 4.433-5.188 7.602-4.809" /><path class="rig-hand-knuckle-mark rig-hand-knuckle-mark-2" d="M271 78c4.117 10.275 2.414 24.575 1.188 35.312l-.213 1.994c-.589 4.651-1.986 8.47-3.975 12.694a351 351 0 0 0-1.375 3.375c-1.874 4.383-4.213 8.518-6.625 12.625l-1.027 1.766L258 147h-2l-.707 2.168c-1.339 3.327-3.49 5.616-5.981 8.144l-1.24 1.377c-1.908 1.95-3.214 3.179-5.965 3.602A41 41 0 0 1 237 162c-1.353-2.707-1.63-5.07-1-8 1.76-2.819 4.041-5.081 6.43-7.371 8.688-9.012 15.506-21.22 17.57-33.629l.332-1.84c1.375-8.964.859-18.031-.309-26.98L260 82c1.881-1.881 2.548-2.359 4.938-3.125l1.527-.508C268 78 268 78 271 78" /></g></g></g><g id="fr-b-mime-hand-left-dance-lucy-raised" opacity="0" data-control-policy="automatic-trace-not-manual-handles" data-geometry="flat-fill-connected-component-automatic-spline-vector-trace" data-source="official-duolingo-lucy-oscar-lin-dancing-2" data-art="lucy-raised" class="rig-hand-dance-art rig-hand-dance-lucy-raised"><g transform="rotate(97.646) scale(0.404925) translate(-67.5 -95.514)"><path id="fr-b-mime-hand-left-dance-lucy-raised-silhouette" fill="#eee9e2" d="M83.688 26.688C91.18 31.83 97.554 39.117 100 48a99 99 0 0 1 .623 3.937c.843 5.851.843 5.851 2.947 7.63 1.21.86 2.473 1.617 3.746 2.378 2.93 1.836 4.107 3.806 4.958 7.122 1.229 5.6 1.125 10.257-1.993 15.175-2.258 3.198-4.551 6.13-8.514 7.042-3.239.49-6.498.606-9.767.716-4.357.206-7.282.98-10.875 3.375-9.232 6.1-19.96 7.322-30.794 5.316-10.334-2.588-19.29-9.753-24.972-18.7-1.124-1.943-2.066-3.94-2.937-6.009-.414-.963-.866-1.9-1.328-2.841-4.184-9.018-2.592-18.996.625-28.07C23.318 40.997 25.623 35.93 29 33h2l.258-1.316c2.19-4.97 9.999-8.126 14.805-10.059 12.663-4.573 26.482-1.985 37.625 5.063" class="rig-hand-silhouette rig-hand-dance-silhouette" /></g></g><g id="fr-b-mime-hand-left-dance-lucy-low" opacity="0" data-control-policy="automatic-trace-not-manual-handles" data-geometry="flat-fill-connected-component-automatic-spline-vector-trace" data-source="official-duolingo-lucy-oscar-lin-dancing-2" data-art="lucy-low" class="rig-hand-dance-art rig-hand-dance-lucy-low"><g transform="rotate(177.636) scale(0.421674) translate(-98.453 -60)"><path id="fr-b-mime-hand-left-dance-lucy-low-silhouette" fill="#eee9e2" d="M82.111 24.633c2.52 1.55 4.727 3.355 6.889 5.367l1.035.957c8.268 7.875 12.733 17.717 13.031 29.168-.091 11.889-5.205 22.194-13.472 30.61-7.248 6.741-18.088 10.687-27.962 10.564-11.748-.574-22.532-5.31-30.507-14.049-5.634-6.626-9.378-15.539-9.152-24.242l.037-2.887q.036-2.244.086-4.489c.206-9.83.206-9.83-1.658-14.437-1.08-2.948-.352-6.264.562-9.195 2.119-4.573 5.702-8.575 10.383-10.598 2.014-.5 3.863-.55 5.93-.527l1.208.002c2.283.026 4.369.242 6.604.748 2.35.474 3.842.187 6.102-.578 10.292-3.102 21.6-1.704 30.884 3.586" class="rig-hand-silhouette rig-hand-dance-silhouette" /></g></g><g id="fr-b-mime-hand-left-dance-lin-right" opacity="0" data-control-policy="automatic-trace-not-manual-handles" data-geometry="flat-fill-connected-component-automatic-spline-vector-trace" data-source="official-duolingo-lucy-oscar-lin-dancing-2" data-art="lin-right" class="rig-hand-dance-art rig-hand-dance-lin-right"><g transform="rotate(69.032) scale(0.420215) translate(-43.563 -97.656)"><path id="fr-b-mime-hand-left-dance-lin-right-silhouette" fill="#eee9e2" d="M70.002 20.562C72.274 22.242 74.055 24.315 75 27c.166 1.853.03 3.65-.125 5.5-.382 4.709-.382 4.709.787 6.532 1.567 1.618 3.367 2.894 5.17 4.234C86.744 47.72 90.807 55.768 92 63c1.166 9.616.008 18.89-5.988 26.73-3.273 3.962-6.875 7.533-11.2 10.333l-.897.581c-7.018 4.045-19.165 3.623-26.763 1.778-8.986-2.819-16.448-10.156-20.796-18.327-2.537-5.169-2.616-10.378-2.757-16.026-.12-4.444-.692-7.843-2.918-11.8-1.455-2.71-1.373-5.336-.681-8.269 1.615-3.136 3.507-5.29 6.715-6.816 4.284-1.341 4.284-1.341 6.413-1.007 1.454.193 2.445.196 3.872-.177 1.925-1.523 3.472-3.284 5.05-5.158 1.282-1.52 2.611-3 3.934-4.487.26-.292.518-.585.785-.887a73.5 73.5 0 0 1 6.794-6.718l.938-.832c4.239-3.602 10.564-4.124 15.501-1.356" class="rig-hand-silhouette rig-hand-dance-silhouette" /></g></g></g></g></g>
</g>
<g id="fr-b-mime-head" class="rig-head"><g id="mime-head-base" class="rig-head-base" data-shape-system="duolingo-rounded-rectangle-head" data-construction="one-rounded-rectangle-plus-two-ear-circles"><ellipse id="fr-b-mime-ear-left" cx="105" cy="151" rx="10" ry="13" fill="#fabd9d" /><ellipse id="fr-b-mime-ear-right" cx="215" cy="151" rx="10" ry="13" fill="#fabd9d" /><rect id="fr-b-mime-head-primary" x="108" y="95" width="104" height="105" rx="31" fill="#fabd9d" /></g><g id="fr-b-mime-face" class="rig-face" clip-path="url(#fr-b-mime-face-clip)" data-idle-head-x="0.00" data-idle-head-y="0.00" data-idle-head-rotation="0.00" data-idle-gaze-x="0.00" data-idle-gaze-y="0.00" data-idle-left-eye-open="1.000" data-idle-right-eye-open="1.000" data-idle-focus-mouth="0.000" data-idle-mouth-width="14.00" data-idle-mouth-height="12.00" data-idle-mouth-y="181.00" data-idle-mouth-rotation="0.00" data-pull-head-x="2.00" data-pull-head-y="0.00" data-pull-head-rotation="2.00" data-pull-gaze-x="3.00" data-pull-gaze-y="0.00" data-pull-left-eye-open="0.920" data-pull-right-eye-open="0.840" data-pull-focus-mouth="0.000" data-pull-mouth-width="14.00" data-pull-mouth-height="9.00" data-pull-mouth-y="181.00" data-pull-mouth-rotation="2.00" data-tug-head-x="-2.00" data-tug-head-y="2.00" data-tug-head-rotation="-3.00" data-tug-gaze-x="2.00" data-tug-gaze-y="1.00" data-tug-left-eye-open="0.720" data-tug-right-eye-open="0.820" data-tug-focus-mouth="0.000" data-tug-mouth-width="18.00" data-tug-mouth-height="16.00" data-tug-mouth-y="182.00" data-tug-mouth-rotation="-2.00" data-tugdeep-head-x="-3.00" data-tugdeep-head-y="3.00" data-tugdeep-head-rotation="-5.00" data-tugdeep-gaze-x="1.00" data-tugdeep-gaze-y="1.50" data-tugdeep-left-eye-open="0.580" data-tugdeep-right-eye-open="0.700" data-tugdeep-focus-mouth="0.000" data-tugdeep-mouth-width="22.00" data-tugdeep-mouth-height="13.00" data-tugdeep-mouth-y="183.00" data-tugdeep-mouth-rotation="-4.00" data-wallcontact-head-x="0.00" data-wallcontact-head-y="0.00" data-wallcontact-head-rotation="0.00" data-wallcontact-gaze-x="0.00" data-wallcontact-gaze-y="-1.00" data-wallcontact-left-eye-open="1.080" data-wallcontact-right-eye-open="1.080" data-wallcontact-focus-mouth="1.000" data-wallcontact-mouth-width="12.00" data-wallcontact-mouth-height="18.00" data-wallcontact-mouth-y="181.00" data-wallcontact-mouth-rotation="0.00" data-wallleanleft-head-x="1.00" data-wallleanleft-head-y="0.00" data-wallleanleft-head-rotation="3.00" data-wallleanleft-gaze-x="3.00" data-wallleanleft-gaze-y="-0.50" data-wallleanleft-left-eye-open="0.700" data-wallleanleft-right-eye-open="0.880" data-wallleanleft-focus-mouth="1.000" data-wallleanleft-mouth-width="23.00" data-wallleanleft-mouth-height="7.00" data-wallleanleft-mouth-y="182.00" data-wallleanleft-mouth-rotation="4.00" data-walltravelright-head-x="1.00" data-walltravelright-head-y="0.00" data-walltravelright-head-rotation="-3.00" data-walltravelright-gaze-x="3.00" data-walltravelright-gaze-y="0.00" data-walltravelright-left-eye-open="0.930" data-walltravelright-right-eye-open="1.030" data-walltravelright-focus-mouth="1.000" data-walltravelright-mouth-width="14.00" data-walltravelright-mouth-height="15.00" data-walltravelright-mouth-y="181.00" data-walltravelright-mouth-rotation="0.00" data-walllowleft-head-x="-1.00" data-walllowleft-head-y="2.00" data-walllowleft-head-rotation="3.00" data-walllowleft-gaze-x="-3.00" data-walllowleft-gaze-y="3.00" data-walllowleft-left-eye-open="0.980" data-walllowleft-right-eye-open="0.760" data-walllowleft-focus-mouth="1.000" data-walllowleft-mouth-width="20.00" data-walllowleft-mouth-height="8.00" data-walllowleft-mouth-y="182.00" data-walllowleft-mouth-rotation="-5.00" data-walllowright-head-x="1.00" data-walllowright-head-y="2.00" data-walllowright-head-rotation="-3.00" data-walllowright-gaze-x="3.00" data-walllowright-gaze-y="3.00" data-walllowright-left-eye-open="0.760" data-walllowright-right-eye-open="0.980" data-walllowright-focus-mouth="1.000" data-walllowright-mouth-width="20.00" data-walllowright-mouth-height="8.00" data-walllowright-mouth-y="182.00" data-walllowright-mouth-rotation="5.00"><rect id="fr-b-mime-face-paint" x="114" y="104" width="92" height="96" rx="30" fill="#f2eee7" /><ellipse id="fr-b-mime-cheek-makeup-left" cx="124" cy="174" rx="7" ry="4.5" fill="#e88982" opacity=".68" /><ellipse id="fr-b-mime-cheek-makeup-right" cx="190" cy="174" rx="7" ry="4.5" fill="#e88982" opacity=".68" /><g id="fr-b-mime-eye-system-left" class="rig-eye-system rig-eye-system-left"><rect id="fr-b-mime-eye-makeup-left" x="124.5" y="128.5" width="28" height="40" rx="14" fill="#343434" /><g id="fr-b-mime-eye-left" class="rig-eye rig-eye-left"><rect id="fr-b-mime-eye-left-white" x="127" y="131" width="23" height="35" rx="11.5" fill="#fffefe" /><g id="fr-b-mime-pupil-left" class="rig-pupil rig-pupil-left"><rect id="fr-b-mime-pupil-left-core" x="135" y="140" width="8" height="19" rx="4" fill="#252625" /></g></g></g><g id="fr-b-mime-eye-system-right" class="rig-eye-system rig-eye-system-right"><rect id="fr-b-mime-eye-makeup-right" x="161.5" y="128.5" width="28" height="40" rx="14" fill="#343434" /><g id="fr-b-mime-eye-right" class="rig-eye rig-eye-right"><rect id="fr-b-mime-eye-right-white" x="164" y="131" width="23" height="35" rx="11.5" fill="#fffefe" /><g id="fr-b-mime-pupil-right" class="rig-pupil rig-pupil-right"><rect id="fr-b-mime-pupil-right-core" x="172" y="140" width="8" height="19" rx="4" fill="#252625" /></g></g></g><ellipse id="fr-b-mime-nose" cx="157" cy="167" rx="8" ry="9" fill="#dd896e" /><path id="fr-b-mime-mouth-smile" class="rig-mouth rig-mouth-idle" d="M157 181 A17 13 0 0 0 178 176" fill="none" stroke="#a43e43" stroke-width="5.5" stroke-linecap="round" /><g id="fr-b-mime-mouth-o" class="rig-mouth rig-mouth-play" transform="rotate(0 157 181)"><rect id="fr-b-mime-mouth-pull-shape" x="150" y="175" width="14" height="12" rx="6" fill="#71383b" /><ellipse id="fr-b-mime-mouth-pull-highlight" cx="157" cy="186" rx="3.2" ry="1.7" fill="#e24b4f" opacity=".25" /></g><g id="fr-b-mime-mouth-wall-focus" class="rig-mouth rig-mouth-wall" opacity="0" transform="rotate(0 157 181)"><rect id="fr-b-mime-mouth-wall-shape" x="150" y="175" width="14" height="12" rx="6" fill="#71383b" /><ellipse id="fr-b-mime-mouth-wall-highlight" cx="157" cy="186" rx="3.2" ry="1.7" fill="#e24b4f" opacity="0" /></g></g><g id="fr-b-mime-hat" class="rig-hat"><ellipse cx="158" cy="96" rx="58" ry="28" transform="rotate(6 158 96)" fill="#252625" /><rect x="153" y="63" width="14" height="21" rx="7" transform="rotate(-12 160 74)" fill="#252625" /></g></g>


</g>
</svg>
`;

  const MIME_CHARACTER = Object.freeze({
    id:'fr-b-mime',
    src:'assets/mascots/FR_B_MIME_BASE_ACTIONS_ONLY_V5_20260814.svg',
    inline:MIME_SVG,
    playMs:2700,
    danceMs:2250,
    wallMs:2900,
  });
  const SUPPORTED_LANGUAGES = Object.freeze([
    'finnish','french','spanish','italian',
    'hebrew','japanese','english_ielts','german'
  ]);
  const CHARACTER_BY_LANGUAGE = Object.freeze(Object.fromEntries(
    SUPPORTED_LANGUAGES.map(language=>[language,MIME_CHARACTER])
  ));

  let host = null;
  let el = null;
  let currentLanguage = null;
  let currentCharacter = FALLBACK;
  let requestSerial = 0;
  let lastQuestion = null;
  let stateTimer = null;
  let ambientTimer = null;
  let blinkTimer = null;
  let jointAnimationFrame = null;
  let jointAnimationSerial = 0;
  const assetCache = new Map();

  function initialLanguage(){
    try{
      if(typeof S!=='undefined' && S && S.lang) return S.lang;
    }catch(_err){ /* S may not exist yet in isolated previews. */ }
    return 'finnish';
  }

  function versionedUrl(src){
    const version=window.APP_VERSION;
    return version===undefined ? src : `${src}?v=${encodeURIComponent(version)}`;
  }

  function loadMarkup(character){
    if(!character.src) return Promise.resolve(character.inline);
    if(assetCache.has(character.src)) return assetCache.get(character.src);
    const pending=fetch(versionedUrl(character.src),{cache:'force-cache'}).then(response=>{
      if(!response.ok) throw new Error(`Mascot asset ${character.src} returned ${response.status}`);
      return response.text();
    }).then(markup=>{
      if(!/^\s*<svg\b/i.test(markup)) throw new Error(`Mascot asset ${character.src} is not SVG`);
      return markup;
    }).catch(error=>{
      // The official file is the source of truth. Keep the byte-identical inline
      // copy only as an offline/partial-deployment fallback so the mascot never
      // disappears merely because the asset request failed.
      if(!character.inline) throw error;
      console.warn('[WordArk mascot] Official SVG unavailable; using inline fallback.',error);
      return character.inline;
    });
    assetCache.set(character.src,pending);
    return pending;
  }

  function clearStateTimer(){
    if(stateTimer){clearTimeout(stateTimer);stateTimer=null;}
  }

  function shortestAngleDelta(from,to){
    let delta=to-from;
    while(delta>180) delta-=360;
    while(delta<=-180) delta+=360;
    return delta;
  }

  function smoothPoseMix(value){
    const t=Math.min(1,Math.max(0,value));
    return t*t*(3-2*t);
  }

  function jointRotation(part,pose){
    const value=Number(part.getAttribute(`data-${pose}-rotation`));
    return Number.isFinite(value)?value:0;
  }

  function applyJointSegment(svg,fromPose,toPose,mix){
    svg.querySelectorAll('.rig-leg-motion,.rig-foot-motion').forEach(part=>{
      if(part.closest('.rig-articulated-leg')) return;
      const from=jointRotation(part,fromPose);
      const to=jointRotation(part,toPose);
      const angle=from+shortestAngleDelta(from,to)*mix;
      part.setAttribute('transform',`rotate(${angle.toFixed(2)})`);
    });
  }

  function legPosePoint(leg,pose,part){
    const x=Number(leg.getAttribute(`data-${pose}-${part}-x`));
    const y=Number(leg.getAttribute(`data-${pose}-${part}-y`));
    const idleX=Number(leg.getAttribute(`data-idle-${part}-x`));
    const idleY=Number(leg.getAttribute(`data-idle-${part}-y`));
    return {
      x:Number.isFinite(x)?x:(Number.isFinite(idleX)?idleX:0),
      y:Number.isFinite(y)?y:(Number.isFinite(idleY)?idleY:0)
    };
  }

  function legPoseFootRotation(leg,pose){
    const value=Number(leg.getAttribute(`data-${pose}-foot-rotation`));
    const idle=Number(leg.getAttribute('data-idle-foot-rotation'));
    return Number.isFinite(value)?value:(Number.isFinite(idle)?idle:0);
  }

  function applyArticulatedLegSegment(svg,fromPose,toPose,mix){
    svg.querySelectorAll('.rig-articulated-leg').forEach(leg=>{
      const side=leg.id.endsWith('-left')?'left':'right';
      const radii={
        shoulder:Number(leg.getAttribute('data-hip-radius'))||0,
        elbow:Number(leg.getAttribute('data-knee-radius'))||0,
        wrist:Number(leg.getAttribute('data-ankle-radius'))||0
      };
      const fromKnee=legPosePoint(leg,fromPose,'knee');
      const toKnee=legPosePoint(leg,toPose,'knee');
      const fromAnkle=legPosePoint(leg,fromPose,'ankle');
      const toAnkle=legPosePoint(leg,toPose,'ankle');
      const knee={x:mixNumber(fromKnee.x,toKnee.x,mix),y:mixNumber(fromKnee.y,toKnee.y,mix)};
      const ankle={x:mixNumber(fromAnkle.x,toAnkle.x,mix),y:mixNumber(fromAnkle.y,toAnkle.y,mix)};
      const fromFoot=legPoseFootRotation(leg,fromPose);
      const toFoot=legPoseFootRotation(leg,toPose);
      const footRotation=fromFoot+shortestAngleDelta(fromFoot,toFoot)*mix;
      const path=svg.querySelector(`#fr-b-mime-leg-path-${side}`);
      const ankleAnchor=svg.querySelector(`#fr-b-mime-ankle-${side}`);
      const foot=svg.querySelector(`#fr-b-mime-foot-motion-${side}`);
      if(path) path.setAttribute('d',variableWidthLimbPathData({x:0,y:0},knee,ankle,radii));
      if(ankleAnchor) ankleAnchor.setAttribute('transform',`translate(${ankle.x.toFixed(2)} ${ankle.y.toFixed(2)})`);
      if(foot) foot.setAttribute('transform',`rotate(${footRotation.toFixed(2)})`);
    });
  }

  function armPosePoint(arm,pose,part){
    const x=Number(arm.getAttribute(`data-${pose}-${part}-x`));
    const y=Number(arm.getAttribute(`data-${pose}-${part}-y`));
    return {x:Number.isFinite(x)?x:0,y:Number.isFinite(y)?y:0};
  }

  function mixNumber(from,to,mix){
    return from+(to-from)*mix;
  }

  function armCenterlineSamples(shoulder,elbow,wrist){
    const landmarks=[shoulder,elbow,wrist];
    const samples=[];
    const stepsPerSegment=12;
    for(let segment=0;segment<landmarks.length-1;segment++){
      const p0=landmarks[Math.max(0,segment-1)];
      const p1=landmarks[segment];
      const p2=landmarks[segment+1];
      const p3=landmarks[Math.min(landmarks.length-1,segment+2)];
      for(let index=0;index<stepsPerSegment;index++){
        if(segment>0&&index===0) continue;
        const t=index/stepsPerSegment;
        const t2=t*t;
        const t3=t2*t;
        samples.push({
          x:.5*(2*p1.x+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
          y:.5*(2*p1.y+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
        });
      }
    }
    samples.push({x:wrist.x,y:wrist.y});
    return samples;
  }
  function variableWidthLimbPathData(shoulder,elbow,wrist,radii){
    const samples=armCenterlineSamples(shoulder,elbow,wrist);
    const lengths=[0];
    for(let index=1;index<samples.length;index++){
      lengths.push(lengths[lengths.length-1]+Math.hypot(samples[index].x-samples[index-1].x,samples[index].y-samples[index-1].y));
    }
    const totalLength=Math.max(.001,lengths[lengths.length-1]);
    const incoming=Math.hypot(elbow.x-shoulder.x,elbow.y-shoulder.y);
    const outgoing=Math.hypot(wrist.x-elbow.x,wrist.y-elbow.y);
    const elbowFraction=incoming/Math.max(.001,incoming+outgoing);
    const left=[];
    const right=[];
    samples.forEach((point,index)=>{
      const previous=samples[Math.max(0,index-1)];
      const next=samples[Math.min(samples.length-1,index+1)];
      const tangentLength=Math.max(.001,Math.hypot(next.x-previous.x,next.y-previous.y));
      const normal={x:-(next.y-previous.y)/tangentLength,y:(next.x-previous.x)/tangentLength};
      const progress=lengths[index]/totalLength;
      const radius=progress<=elbowFraction
        ? mixNumber(radii.shoulder,radii.elbow,smoothPoseMix(progress/Math.max(.001,elbowFraction)))
        : mixNumber(radii.elbow,radii.wrist,smoothPoseMix((progress-elbowFraction)/Math.max(.001,1-elbowFraction)));
      left.push({x:point.x+normal.x*radius,y:point.y+normal.y*radius});
      right.push({x:point.x-normal.x*radius,y:point.y-normal.y*radius});
    });
    return `M${left[0].x.toFixed(2)} ${left[0].y.toFixed(2)} ${left.slice(1).map(point=>`L${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')} ${right.reverse().map(point=>`L${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')} Z`;
  }

  function taperedSegmentPathData(start,end,startRadius,endRadius){
    const length=Math.max(.001,Math.hypot(end.x-start.x,end.y-start.y));
    const normal={x:-(end.y-start.y)/length,y:(end.x-start.x)/length};
    const points=[
      {x:start.x+normal.x*startRadius,y:start.y+normal.y*startRadius},
      {x:end.x+normal.x*endRadius,y:end.y+normal.y*endRadius},
      {x:end.x-normal.x*endRadius,y:end.y-normal.y*endRadius},
      {x:start.x-normal.x*startRadius,y:start.y-normal.y*startRadius}
    ];
    return `M${points.map(point=>`${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L')} Z`;
  }

  function forearmBandPathData(elbow,wrist,radii,length,overlap){
    const forearmLength=Math.max(.001,Math.hypot(wrist.x-elbow.x,wrist.y-elbow.y));
    const unit={x:(wrist.x-elbow.x)/forearmLength,y:(wrist.y-elbow.y)/forearmLength};
    const endDistance=Math.max(0,forearmLength-overlap);
    const startDistance=Math.max(0,endDistance-length);
    const start={x:elbow.x+unit.x*startDistance,y:elbow.y+unit.y*startDistance};
    const end={x:elbow.x+unit.x*endDistance,y:elbow.y+unit.y*endDistance};
    const startRadius=mixNumber(radii.elbow,radii.wrist,startDistance/forearmLength)+.6;
    const endRadius=mixNumber(radii.elbow,radii.wrist,endDistance/forearmLength)+.6;
    return taperedSegmentPathData(start,end,startRadius,endRadius);
  }

  function armPoseHand(arm,pose){
    const value=Number(arm.getAttribute(`data-${pose}-hand-pose`));
    return Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
  }

  const MIME_DANCE_HAND_ARTS=['lucy-raised','lucy-low','lin-right'];

  function armPoseHandArt(arm,pose){
    const value=arm.getAttribute(`data-${pose}-hand-art`)||'base';
    return MIME_DANCE_HAND_ARTS.includes(value)?value:'base';
  }

  function armPoseHandRotationOffset(arm,pose){
    const value=Number(arm.getAttribute(`data-${pose}-hand-rotation-offset`));
    return Number.isFinite(value)?value:0;
  }

  function armPoseHandScale(arm,pose){
    const value=Number(arm.getAttribute(`data-${pose}-hand-scale`));
    return Number.isFinite(value)&&value>0?value:1;
  }

  function mimeHandWeights(handPose){
    const value=Math.max(0,Math.min(1,handPose));
    if(value<=.52){
      const reach=smoothPoseMix(value/.52);
      return {idle:1-reach,reach,grip:0};
    }
    const grip=smoothPoseMix((value-.52)/.48);
    return {idle:0,reach:1-grip,grip};
  }

  function applyMimeHandPose(hand,handPose,fromArt='base',toArt='base',artMix=1){
    if(!hand) return;
    const value=Math.max(0,Math.min(1,handPose));
    const weights=mimeHandWeights(value);
    const normalizeArt=art=>MIME_DANCE_HAND_ARTS.includes(art)?art:'base';
    const sourceArt=normalizeArt(fromArt);
    const targetArt=normalizeArt(toArt);
    // Never cross-fade two differently shaped hand silhouettes. Partial
    // opacity exposes the dark sleeve/background along their non-overlapping
    // edges and reads as a bite or hole in the hand during dance transitions.
    // Keep exactly one complete silhouette visible while the wrist and arm
    // geometry continue to interpolate smoothly.
    const blend=sourceArt===targetArt?1:smoothPoseMix(artMix);
    const selectedArt=sourceArt===targetArt
      ? sourceArt
      : (blend<.5?sourceArt:targetArt);
    const artWeights=Object.fromEntries(MIME_DANCE_HAND_ARTS.map(art=>[art,0]));
    const baseOpacity=selectedArt==='base'?1:0;
    if(selectedArt!=='base') artWeights[selectedArt]=1;
    const shape=hand.querySelector('.rig-hand-continuous');
    if(shape){
      shape.setAttribute('data-hand-pose',value.toFixed(3));
      shape.setAttribute('data-hand-art',selectedArt);
    }
    for(const pose of ['idle','reach','grip']){
      const art=hand.querySelector(`.rig-hand-pose-${pose}`);
      if(art) art.setAttribute('opacity',(weights[pose]*baseOpacity).toFixed(3));
    }
    for(const artName of MIME_DANCE_HAND_ARTS){
      const art=hand.querySelector(`.rig-hand-dance-${artName}`);
      if(art) art.setAttribute('opacity',artWeights[artName].toFixed(3));
    }
  }

  function applyArticulatedArmSegment(svg,fromPose,toPose,mix){
    svg.querySelectorAll('.rig-articulated-arm').forEach(arm=>{
      const side=arm.id.endsWith('-left')?'left':'right';
      const shoulderX=Number(arm.getAttribute('data-shoulder-x'))||0;
      const shoulderY=Number(arm.getAttribute('data-shoulder-y'))||0;
      const radii={
        shoulder:Number(arm.getAttribute('data-shoulder-radius'))||0,
        elbow:Number(arm.getAttribute('data-elbow-radius'))||0,
        wrist:Number(arm.getAttribute('data-wrist-radius'))||0
      };
      const bandLength=Number(arm.getAttribute('data-band-length'))||0;
      const bandOverlap=Number(arm.getAttribute('data-band-overlap'))||0;
      const fromElbow=armPosePoint(arm,fromPose,'elbow');
      const toElbow=armPosePoint(arm,toPose,'elbow');
      const fromWrist=armPosePoint(arm,fromPose,'wrist');
      const toWrist=armPosePoint(arm,toPose,'wrist');
      const fromHandPose=armPoseHand(arm,fromPose);
      const toHandPose=armPoseHand(arm,toPose);
      const fromHandArt=armPoseHandArt(arm,fromPose);
      const toHandArt=armPoseHandArt(arm,toPose);
      const fromHandRotationOffset=armPoseHandRotationOffset(arm,fromPose);
      const toHandRotationOffset=armPoseHandRotationOffset(arm,toPose);
      const fromHandScale=armPoseHandScale(arm,fromPose);
      const toHandScale=armPoseHandScale(arm,toPose);
      const fromWall=fromPose.startsWith('wall');
      const toWall=toPose.startsWith('wall');
      const needsStableForearm=fromWall||toWall;
      const elbowX=mixNumber(fromElbow.x,toElbow.x,mix);
      const elbowY=mixNumber(fromElbow.y,toElbow.y,mix);
      let wristX;
      let wristY;
      if(needsStableForearm){
        const fromForearmLength=Math.max(.001,Math.hypot(fromWrist.x-fromElbow.x,fromWrist.y-fromElbow.y));
        const toForearmLength=Math.max(.001,Math.hypot(toWrist.x-toElbow.x,toWrist.y-toElbow.y));
        const fromForearmAngle=Math.atan2(fromWrist.y-fromElbow.y,fromWrist.x-fromElbow.x)*180/Math.PI;
        const toForearmAngle=Math.atan2(toWrist.y-toElbow.y,toWrist.x-toElbow.x)*180/Math.PI;
        const forearmAngle=fromForearmAngle+shortestAngleDelta(fromForearmAngle,toForearmAngle)*mix;
        const forearmLength=mixNumber(fromForearmLength,toForearmLength,mix);
        const forearmRadians=forearmAngle*Math.PI/180;
        wristX=elbowX+Math.cos(forearmRadians)*forearmLength;
        wristY=elbowY+Math.sin(forearmRadians)*forearmLength;
      }else{
        wristX=mixNumber(fromWrist.x,toWrist.x,mix);
        wristY=mixNumber(fromWrist.y,toWrist.y,mix);
      }
      let handMix=mix;
      if(!fromWall&&toWall) handMix=smoothPoseMix(Math.min(1,mix/.45));
      else if(fromWall&&!toWall) handMix=smoothPoseMix(Math.max(0,(mix-.78)/.22));
      const handPose=mixNumber(fromHandPose,toHandPose,handMix);
      const handRotationOffset=needsStableForearm
        ? fromHandRotationOffset+shortestAngleDelta(fromHandRotationOffset,toHandRotationOffset)*mix
        : mixNumber(fromHandRotationOffset,toHandRotationOffset,mix);
      const handScale=mixNumber(fromHandScale,toHandScale,mix);
      const forearmAbsolute=Math.atan2(wristY-elbowY,wristX-elbowX)*180/Math.PI;
      const handRotation=forearmAbsolute+handRotationOffset;
      const sleeve=svg.querySelector(`#fr-b-mime-arm-sleeve-${side}`);
      const elbow=svg.querySelector(`#fr-b-mime-elbow-${side}`);
      const band=svg.querySelector(`#fr-b-mime-sleeve-band-${side}`);
      const hand=svg.querySelector(`#fr-b-mime-hand-${side}`);
      const forearmLength=Math.max(.001,Math.hypot(wristX-elbowX,wristY-elbowY));
      const forearmUnit={x:(wristX-elbowX)/forearmLength,y:(wristY-elbowY)/forearmLength};
      const sleeveWrist={x:wristX,y:wristY};
      const sleevePath=variableWidthLimbPathData(
        {x:shoulderX,y:shoulderY},
        {x:elbowX,y:elbowY},
        sleeveWrist,
        radii
      );
      if(sleeve) sleeve.setAttribute('d',sleevePath);
      if(elbow){
        elbow.setAttribute('transform',`translate(${elbowX.toFixed(2)} ${elbowY.toFixed(2)})`);
      }
      if(band){
        band.setAttribute('d',forearmBandPathData(
            {x:elbowX,y:elbowY},
            {x:wristX,y:wristY},
            radii,
            bandLength,
            bandOverlap
          ));
      }
      if(hand){
        hand.setAttribute('transform',`translate(${wristX.toFixed(2)} ${wristY.toFixed(2)}) rotate(${handRotation.toFixed(2)}) scale(${handScale.toFixed(3)})`);
        applyMimeHandPose(hand,handPose,fromHandArt,toHandArt,mix);
      }
    });
  }

  function rootPoseNumber(root,pose,axis){
    const value=Number(root.getAttribute(`data-${pose}-${axis}`));
    return Number.isFinite(value)?value:0;
  }

  function applyMimeRootSegment(svg,fromPose,toPose,mix){
    const root=svg.querySelector('#fr-b-mime-character-motion');
    if(!root) return;
    const fromX=rootPoseNumber(root,fromPose,'x');
    const toX=rootPoseNumber(root,toPose,'x');
    const fromY=rootPoseNumber(root,fromPose,'y');
    const toY=rootPoseNumber(root,toPose,'y');
    const fromRotation=rootPoseNumber(root,fromPose,'rotation');
    const toRotation=rootPoseNumber(root,toPose,'rotation');
    const x=fromX+(toX-fromX)*mix;
    const y=fromY+(toY-fromY)*mix;
    const rotation=fromRotation+shortestAngleDelta(fromRotation,toRotation)*mix;
    const pivotX=Number(root.getAttribute('data-pivot-x'))||164;
    const pivotY=Number(root.getAttribute('data-pivot-y'))||388;
    root.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(2)} ${pivotX.toFixed(2)} ${pivotY.toFixed(2)})`);
  }

  function shadowPoseNumber(shadow,pose,axis,fallback){
    const value=Number(shadow.getAttribute(`data-${pose}-${axis}`));
    return Number.isFinite(value)?value:fallback;
  }

  function applyMimeShadowSegment(svg,fromPose,toPose,mix){
    const shadow=svg.querySelector('#fr-b-mime-shadow');
    if(!shadow) return;
    const centerX=Number(shadow.getAttribute('data-center-x'))||160;
    const centerY=Number(shadow.getAttribute('data-center-y'))||452;
    const x=mixNumber(shadowPoseNumber(shadow,fromPose,'x',0),shadowPoseNumber(shadow,toPose,'x',0),mix);
    const y=mixNumber(shadowPoseNumber(shadow,fromPose,'y',0),shadowPoseNumber(shadow,toPose,'y',0),mix);
    const scaleX=mixNumber(shadowPoseNumber(shadow,fromPose,'scale-x',1),shadowPoseNumber(shadow,toPose,'scale-x',1),mix);
    const scaleY=mixNumber(shadowPoseNumber(shadow,fromPose,'scale-y',1),shadowPoseNumber(shadow,toPose,'scale-y',1),mix);
    const opacity=mixNumber(shadowPoseNumber(shadow,fromPose,'opacity',.62),shadowPoseNumber(shadow,toPose,'opacity',.62),mix);
    shadow.setAttribute('transform',`translate(${(centerX+x).toFixed(2)} ${(centerY+y).toFixed(2)}) scale(${scaleX.toFixed(3)} ${scaleY.toFixed(3)}) translate(${-centerX} ${-centerY})`);
    shadow.setAttribute('opacity',opacity.toFixed(3));
  }

  function facePoseNumber(face,pose,axis,fallback){
    const raw=face.getAttribute(`data-${pose}-${axis}`);
    if(raw!==null&&raw!==''){
      const value=Number(raw);
      if(Number.isFinite(value)) return value;
    }
    const idleRaw=face.getAttribute(`data-idle-${axis}`);
    if(idleRaw!==null&&idleRaw!==''){
      const idle=Number(idleRaw);
      if(Number.isFinite(idle)) return idle;
    }
    return fallback;
  }

  function applyMimeEyeGeometry(svg,side,openness){
    const eyeCenterY=148.5;
    const pupilCenterY=149.5;
    const eye=svg.querySelector(`#fr-b-mime-eye-${side}`);
    const makeup=svg.querySelector(`#fr-b-mime-eye-makeup-${side}`);
    const white=svg.querySelector(`#fr-b-mime-eye-${side}-white`);
    const pupil=svg.querySelector(`#fr-b-mime-pupil-${side}-core`);
    const open=Math.max(.48,Math.min(1.12,openness));
    const eyeHeight=35*open;
    const makeupHeight=eyeHeight+5;
    const pupilHeight=19*Math.min(1,open);
    if(eye) eye.removeAttribute('transform');
    if(makeup){
      makeup.setAttribute('y',(eyeCenterY-makeupHeight/2).toFixed(2));
      makeup.setAttribute('height',makeupHeight.toFixed(2));
      makeup.setAttribute('rx',Math.min(14,makeupHeight/2).toFixed(2));
    }
    if(white){
      white.setAttribute('y',(eyeCenterY-eyeHeight/2).toFixed(2));
      white.setAttribute('height',eyeHeight.toFixed(2));
      white.setAttribute('rx',Math.min(11.5,eyeHeight/2).toFixed(2));
    }
    if(pupil){
      pupil.setAttribute('y',(pupilCenterY-pupilHeight/2).toFixed(2));
      pupil.setAttribute('height',pupilHeight.toFixed(2));
      pupil.setAttribute('rx',Math.min(4,pupilHeight/2).toFixed(2));
    }
  }

  function applyMimeMouthGeometry(svg,selectors,width,height,y,rotation,opacity){
    const group=svg.querySelector(selectors.group);
    const shape=svg.querySelector(selectors.shape);
    const highlight=svg.querySelector(selectors.highlight);
    if(!group) return;
    const centerX=157;
    const safeWidth=Math.max(7,width);
    const safeHeight=Math.max(4,height);
    group.setAttribute('opacity',opacity.toFixed(3));
    group.setAttribute('transform',`rotate(${rotation.toFixed(2)} ${centerX} ${y.toFixed(2)})`);
    if(shape){
      shape.setAttribute('x',(centerX-safeWidth/2).toFixed(2));
      shape.setAttribute('y',(y-safeHeight/2).toFixed(2));
      shape.setAttribute('width',safeWidth.toFixed(2));
      shape.setAttribute('height',safeHeight.toFixed(2));
      shape.setAttribute('rx',Math.min(safeWidth/2,safeHeight/2).toFixed(2));
    }
    if(highlight){
      const openAmount=Math.max(0,Math.min(1,(safeHeight-10)/7));
      highlight.setAttribute('cx',centerX.toFixed(2));
      highlight.setAttribute('cy',(y+safeHeight*.25).toFixed(2));
      highlight.setAttribute('rx',Math.min(3.2,safeWidth*.24).toFixed(2));
      highlight.setAttribute('ry',Math.min(1.7,safeHeight*.11).toFixed(2));
      highlight.setAttribute('opacity',(openAmount*opacity).toFixed(3));
    }
  }

  function applyMimeWallMouthGeometry(svg,width,height,y,rotation,opacity){
    applyMimeMouthGeometry(svg,{
      group:'#fr-b-mime-mouth-wall-focus',
      shape:'#fr-b-mime-mouth-wall-shape',
      highlight:'#fr-b-mime-mouth-wall-highlight'
    },width,height,y,rotation,opacity);
  }

  function applyMimePlayMouthGeometry(svg,width,height,y,rotation){
    applyMimeMouthGeometry(svg,{
      group:'#fr-b-mime-mouth-o',
      shape:'#fr-b-mime-mouth-pull-shape',
      highlight:'#fr-b-mime-mouth-pull-highlight'
    },width,height,y,rotation,1);
  }

  function applyMimeFaceSegment(svg,fromPose,toPose,mix){
    const face=svg.querySelector('#fr-b-mime-face');
    const head=svg.querySelector('#fr-b-mime-head');
    if(!face||!head) return;
    const value=(axis,fallback)=>mixNumber(
      facePoseNumber(face,fromPose,axis,fallback),
      facePoseNumber(face,toPose,axis,fallback),
      mix
    );
    const headX=value('head-x',0);
    const headY=value('head-y',0);
    const headRotation=value('head-rotation',0);
    const gazeX=value('gaze-x',0);
    const gazeY=value('gaze-y',0);
    const leftEyeOpen=value('left-eye-open',1);
    const rightEyeOpen=value('right-eye-open',1);
    const focusMouth=Math.max(0,Math.min(1,value('focus-mouth',0)));
    const mouthWidth=value('mouth-width',14);
    const mouthHeight=value('mouth-height',12);
    const mouthY=value('mouth-y',181);
    const mouthRotation=value('mouth-rotation',0);
    head.setAttribute('transform',`translate(${headX.toFixed(2)} ${headY.toFixed(2)}) rotate(${headRotation.toFixed(2)} 160 200)`);
    applyMimeEyeGeometry(svg,'left',leftEyeOpen);
    applyMimeEyeGeometry(svg,'right',rightEyeOpen);
    for(const side of ['left','right']){
      const pupil=svg.querySelector(`#fr-b-mime-pupil-${side}`);
      if(pupil) pupil.setAttribute('transform',`translate(${gazeX.toFixed(2)} ${gazeY.toFixed(2)})`);
    }
    const smile=svg.querySelector('#fr-b-mime-mouth-smile');
    const fromWall=fromPose.startsWith('wall');
    const toWall=toPose.startsWith('wall');
    let smileOpacity=1-focusMouth;
    let focusOpacity=focusMouth;
    if(!fromWall&&toWall){
      const useWallMouth=mix>=.18;
      smileOpacity=useWallMouth?0:1;
      focusOpacity=useWallMouth?1:0;
    }else if(fromWall&&!toWall){
      const useIdleMouth=mix>=.82;
      smileOpacity=useIdleMouth?1:0;
      focusOpacity=useIdleMouth?0:1;
    }
    if(smile) smile.setAttribute('opacity',smileOpacity.toFixed(3));
    applyMimePlayMouthGeometry(svg,mouthWidth,mouthHeight,mouthY,mouthRotation);
    applyMimeWallMouthGeometry(svg,mouthWidth,mouthHeight,mouthY,mouthRotation,focusOpacity);
  }

  function animateMimeJoints(svg,state){
    if(!svg || !svg.querySelector('.rig-articulated-arm')) return;
    const serial=++jointAnimationSerial;
    if(jointAnimationFrame && typeof cancelAnimationFrame==='function'){
      cancelAnimationFrame(jointAnimationFrame);
    }
    jointAnimationFrame=null;
    if(state==='idle'){
      applyJointSegment(svg,'idle','idle',1);
      applyArticulatedLegSegment(svg,'idle','idle',1);
      applyArticulatedArmSegment(svg,'idle','idle',1);
      applyMimeRootSegment(svg,'idle','idle',1);
      applyMimeShadowSegment(svg,'idle','idle',1);
      applyMimeFaceSegment(svg,'idle','idle',1);
      return;
    }
    const timeline=state==='play'
      ? {duration:2600,frames:[[0,'idle'],[.12,'pull'],[.24,'tug'],[.36,'pull'],[.48,'tugdeep'],[.60,'pull'],[.72,'tugdeep'],[.84,'tug'],[1,'idle']]}
        : state==='dance'
          ? {duration:2200,frames:[[0,'idle'],[.12,'danceleft'],[.26,'danceright'],[.40,'danceleft'],[.54,'danceright'],[.68,'danceopen'],[.80,'dancejump'],[.88,'danceopen'],[1,'idle']]}
          : state==='wall'
          ? {duration:2800,frames:[[0,'idle'],[.12,'wallcontact'],[.30,'wallleanleft'],[.47,'walltravelright'],[.66,'walllowleft'],[.84,'walllowright'],[1,'idle']]}
            : {duration:1100,frames:[[0,'idle'],[1,'idle']]};
    let startedAt=null;
    const frame=(timestamp)=>{
      if(serial!==jointAnimationSerial || svg!==el) return;
      if(startedAt===null) startedAt=Number.isFinite(timestamp)?timestamp:Date.now();
      const now=Number.isFinite(timestamp)?timestamp:Date.now();
      const progress=Math.min(1,Math.max(0,(now-startedAt)/timeline.duration));
      let index=0;
      while(index+1<timeline.frames.length && progress>timeline.frames[index+1][0]) index++;
      const current=timeline.frames[index];
      const next=timeline.frames[Math.min(index+1,timeline.frames.length-1)];
      const span=Math.max(.0001,next[0]-current[0]);
      const mix=smoothPoseMix((progress-current[0])/span);
      applyJointSegment(svg,current[1],next[1],mix);
      applyArticulatedLegSegment(svg,current[1],next[1],mix);
      applyArticulatedArmSegment(svg,current[1],next[1],mix);
      applyMimeRootSegment(svg,current[1],next[1],mix);
      applyMimeShadowSegment(svg,current[1],next[1],mix);
      applyMimeFaceSegment(svg,current[1],next[1],mix);
      if(progress<1 && typeof requestAnimationFrame==='function'){
        jointAnimationFrame=requestAnimationFrame(frame);
      }else{
        jointAnimationFrame=null;
      }
    };
    if(typeof requestAnimationFrame==='function') jointAnimationFrame=requestAnimationFrame(frame);
    else{
      const finalPose=timeline.frames.at(-1)[1];
      applyJointSegment(svg,finalPose,finalPose,1);
      applyArticulatedLegSegment(svg,finalPose,finalPose,1);
      applyArticulatedArmSegment(svg,finalPose,finalPose,1);
      applyMimeRootSegment(svg,finalPose,finalPose,1);
      applyMimeShadowSegment(svg,finalPose,finalPose,1);
      applyMimeFaceSegment(svg,finalPose,finalPose,1);
    }
  }

  function mount(markup,character){
    clearStateTimer();
    host.innerHTML=markup;
    el=host.querySelector('svg');
    if(!el) throw new Error('Mascot SVG root was not found');
    currentCharacter=character;
    host.dataset.mascot=character.id;
    host.classList.remove('is-loading','load-error');
    el.removeAttribute('width');
    el.removeAttribute('height');
    el.classList.add('mascot-svg');
    el.setAttribute('aria-hidden','true');
    el.setAttribute('focusable','false');
    setState('idle');
  }

  function setState(state,duration){
    if(!el) return;
    clearStateTimer();
    el.classList.remove('blink','cheer','mascot-action-play','mascot-action-dance','mascot-action-wall');

    if(el.classList.contains('mascot-rig')){
      const requested=['idle','play','dance','wall'].includes(state)?state:'idle';
      el.dataset.state=requested;
      void el.getBoundingClientRect();
      if(requested!=='idle') el.classList.add(`mascot-action-${requested}`);
      animateMimeJoints(el,requested);
    }else{
      // Existing fox fallback: keep its old happy rig, but never activate sad.
      el.dataset.state=state;
      if(state!=='idle'){
        void el.getBoundingClientRect();
        el.classList.add('cheer');
      }
    }

    if(duration){
      stateTimer=setTimeout(()=>setState('idle'),duration);
    }
  }

  function setLanguage(lang){
    if(!host) return Promise.resolve(null);
    const normalized=lang||'finnish';
    if(normalized===currentLanguage && el) return Promise.resolve(currentCharacter);
    currentLanguage=normalized;
    const character=CHARACTER_BY_LANGUAGE[normalized]||FALLBACK;
    const serial=++requestSerial;
    host.classList.add('is-loading');

    return loadMarkup(character).then(markup=>{
      if(serial!==requestSerial) return currentCharacter;
      mount(markup,character);
      return character;
    }).catch(error=>{
      console.error('[WordArk mascot]',error);
      if(serial!==requestSerial) return currentCharacter;
      host.classList.add('load-error');
      mount(FALLBACK.inline,FALLBACK);
      return FALLBACK;
    });
  }

  function isVisible(){
    return !!(host && host.getClientRects().length && !host.closest('.screen.hidden'));
  }

  function scheduleBlink(){
    if(blinkTimer) clearTimeout(blinkTimer);
    blinkTimer=setTimeout(()=>{
      if(el && currentCharacter===FALLBACK && el.dataset.state==='idle'){
        el.classList.add('blink');
        setTimeout(()=>el && el.classList.remove('blink'),160);
      }
      scheduleBlink();
    },2000+Math.random()*2800);
  }

  function scheduleAmbient(){
    if(ambientTimer) clearTimeout(ambientTimer);
    ambientTimer=setTimeout(()=>{
      if(isVisible() && el && el.dataset.state==='idle'){
        const roll=Math.random();
        if(currentCharacter.id==='fr-b-mime' && roll<.34) airWall();
        else if(currentCharacter.id==='fr-b-mime' && roll<.67) play();
        else if(currentCharacter.id==='fr-b-mime') dance();
        else play();
      }
      scheduleAmbient();
    },7000+Math.random()*5000);
  }

  function burst(){
    if(!host) return;
    const glyphs=['✨','⭐','🎉'];
    for(let i=0;i<5;i++){
      const s=document.createElement('span');
      s.className='mascot-spark';
      s.textContent=glyphs[i%glyphs.length];
      const angle=(Math.PI*2*i)/5;
      s.style.setProperty('--dx', Math.cos(angle)*46+'px');
      s.style.setProperty('--dy', (Math.sin(angle)*46-16)+'px');
      s.style.setProperty('--rot', (Math.random()*60-30)+'deg');
      host.appendChild(s);
      requestAnimationFrame(()=>s.classList.add('go'));
      setTimeout(()=>s.remove(), 850);
    }
  }

  function play(withBurst=false){
    if(!el) return;
    setState('play',currentCharacter.playMs||1400);
    if(withBurst) burst();
  }

  function dance(duration){
    if(!el) return;
    if(currentCharacter.id!=='fr-b-mime'){
      play();
      return;
    }
    setState('dance',duration||currentCharacter.danceMs||2250);
  }

  function airWall(duration){
    if(!el) return;
    if(currentCharacter.id!=='fr-b-mime'){
      play();
      return;
    }
    setState('wall',duration||currentCharacter.wallMs||2900);
  }

  let celebrateLoopTimer=null;
  function stopCelebrateLoop(){
    if(celebrateLoopTimer){ clearTimeout(celebrateLoopTimer); celebrateLoopTimer=null; }
  }

  function celebrate(){
    stopCelebrateLoop();
    if(currentCharacter===FALLBACK){ play(true); return; }
    if(currentCharacter.id!=='fr-b-mime'){ play(true); return; }

    const options=[
      {fn:play, ms:currentCharacter.playMs||2700},
      {fn:dance, ms:currentCharacter.danceMs||2250},
      {fn:airWall, ms:currentCharacter.wallMs||2900}
    ];
    const chosen=options[Math.floor(Math.random()*options.length)];

    // Repeat the SAME chosen action back-to-back instead of letting it fall
    // to idle — stops on its own once the page holding #mascot-host is gone
    // (Play Again / Back to Lessons navigates away), no manual cleanup call needed.
    (function loop(){
      if(!host || !host.isConnected){ celebrateLoopTimer=null; return; }
      chosen.fn();
      burst();
      if(typeof SFX!=='undefined') SFX.chime();
      celebrateLoopTimer=setTimeout(loop, chosen.ms);
    })();
  }

  function onQuestion(lang,question){
    const changed=!question || question!==lastQuestion;
    if(question) lastQuestion=question;
    return setLanguage(lang).then(()=>{
      if(!changed) return;
      setState('idle');
    });
  }

  window.Mascot = {
    setLanguage,
    onQuestion,
    idle(){setState('idle');},
    play,
    dance,
    airWall,
    cheer(){play(true);},
    celebrate,
    // Backward-compatible no-op: wrong answers never produce a negative pose.
    sad(){setState('idle');},
    // Call after any code replaces #mascot-host's container via innerHTML=
    // (e.g. showComplete() rebuilding #q-area) — the old `host` reference is
    // now a detached node, so re-find it and re-mount the current character.
    refreshHost(){
      const found=document.getElementById('mascot-host');
      if(!found) return Promise.resolve(null);
      // Only short-circuit when this exact host still contains the live SVG.
      // If Safari kept the host reference but cleared/replaced its children,
      // force a fresh mount instead of leaving an empty mascot area.
      if(found===host && el && found.contains(el)) return Promise.resolve(currentCharacter);
      host=found;
      el=null; // old el is a detached node from the previous container; force setLanguage() to actually re-mount instead of short-circuiting on "language unchanged"
      if(!ambientStarted){ ambientStarted=true; scheduleBlink(); scheduleAmbient(); }
      return setLanguage(currentLanguage||initialLanguage());
    },
    getState(){
      return {
        language:currentLanguage,
        character:currentCharacter.id,
        state:el?.dataset.state||null,
      };
    }
  };

  let ambientStarted=false;
  function init(){
    host=document.getElementById('mascot-host');
    if(!host) return;
    ambientStarted=true;
    setLanguage(initialLanguage());
    scheduleBlink();
    scheduleAmbient();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
