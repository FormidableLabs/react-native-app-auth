require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']
  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.ios.deployment_target = '10.0'
  s.osx.deployment_target = '10.15'
  s.source       = { :git => 'https://github.com/FormidableLabs/react-native-app-auth.git', :tag => "v#{s.version}" }
  s.source_files  = 'ios/**/*.{h,m}'
  s.requires_arc = true
  s.dependency 'React-Core'
  s.dependency 'AppAuth', '>= 1.7.3'
end
