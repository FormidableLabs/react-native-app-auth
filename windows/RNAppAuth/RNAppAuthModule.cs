using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace App.Auth.RNAppAuth
{
    /// <summary>
    /// A module that allows JS to share data.
    /// </summary>
    class RNAppAuthModule : NativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="RNAppAuthModule"/>.
        /// </summary>
        internal RNAppAuthModule()
        {

        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RNAppAuth";
            }
        }
    }
}
