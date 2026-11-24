require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoAdapterRNAppAuth'
  s.version        = package['version']
  s.summary        = 'Forwards Expo AppDelegate redirect URLs to react-native-app-auth'
  s.license        = package['license']
  s.authors        = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '15.1'
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/FormidableLabs/react-native-app-auth.git', :tag => "v#{s.version}" }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'react-native-app-auth'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = "#{s.name}/**/*.{h,swift}"
end
