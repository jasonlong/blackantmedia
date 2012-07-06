load 'deploy' if respond_to?(:namespace) # cap2 differentiator
Dir['vendor/plugins/*/recipes/*.rb'].each { |plugin| load(plugin) }

set :use_sudo,          false
#set :home_path,         "/var/www/mysitename"
set :scm,               :git
set :repository,        "git@github.com:jasonlong/blackantmedia.git"
set(:current_branch)     { `git branch`.match(/\* (\S+)\s/m)[1] || raise("Couldn't determine current branch") }
set :branch,             defer { current_branch }
set :repository_cache,  "git_cache"
set :deploy_via,        :remote_cache
set :deploy_to,         "/home/blackant/blackantmedia"
role :web,              "blackant"


namespace :deploy do
  task :restart do
    symlink_settings
    cleanup
  end
end

task :symlink_settings do
 run <<-CMD
   rm -rf #{release_path}/config/settings.php &&
   ln -nfs #{shared_path}/settings.php #{release_path}/config/settings.php
 CMD
end

