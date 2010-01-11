load 'deploy' if respond_to?(:namespace) # cap2 differentiator
Dir['vendor/plugins/*/recipes/*.rb'].each { |plugin| load(plugin) }

set :use_sudo,          false
set :home_path,         "/var/www/mysitename"
set :scm,               :git
set :repository,        "git@github.com:blackant/blackantmedia.git"
set :branch,            "master"
set :repository_cache,  "git_cache"
set :deploy_via,        :remote_cache
set :deploy_to,         "/home/blackant/subdomains/v2"
role :web,              "blackant"

# the restart task apparently needs to be here, let's use 
# it to run the cleanup task (keep last 5 releases)
namespace :deploy do
  task :restart do
    cleanup
  end
end
