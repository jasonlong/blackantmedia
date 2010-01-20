load 'deploy' if respond_to?(:namespace) # cap2 differentiator
Dir['vendor/plugins/*/recipes/*.rb'].each { |plugin| load(plugin) }

set :application,       "blackantmedia"
set :use_sudo,          false
set :scm,               :git
set :repository,        "git@github.com:blackant/blackantmedia.git"
set(:current_branch)    { `git branch`.match(/\* (\S+)\s/m)[1] || raise("Couldn't determine current branch") }
set :branch,            defer { current_branch }
set :repository_cache,  "git_cache"
set :deploy_via,        :remote_cache
role :web,              "blackant"

task :production do
  set :deploy_to,         "/home/blackant/blackantmedia"
end

task :staging do
  set :deploy_to,         "/home/blackant/subdomains/v2"
end

# the restart task apparently needs to be here, let's use 
# it to run the cleanup task (keep last 5 releases)
namespace :deploy do
  task :restart do
    cleanup
  end
end
