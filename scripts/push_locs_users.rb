require 'rubygems'
require 'json'
require 'net/http'
require 'pp'

module Couch
  class Server
    def initialize(host, port, user = nil, pass = nil, options = nil)
      @host = host
      @port = port
      @user = user
      @pass = pass
      @options = options
    end

    def delete(uri)
      request(Net::HTTP::Delete.new(uri))
    end

    def get(uri)
      request(Net::HTTP::Get.new(uri))
    end

    def put(uri, json)
      req = Net::HTTP::Put.new(uri)
      req["content-type"] = "application/json"
      req.body = json
      request(req)
    end

    def post(uri, json)
      req = Net::HTTP::Post.new(uri)
      req["content-type"] = "application/json"
      req.body = json
      request(req)
    end

    def request(req)
      if @user and @pass
        req.basic_auth @user, @pass
      end
      res = Net::HTTP.start(@host, @port) { |http|http.request(req) }
      unless res.kind_of?(Net::HTTPSuccess)
        handle_error(req, res)
      end
      res
    end

    private

    def handle_error(req, res)
      e = RuntimeError.new("#{res.code}:#{res.message}\nMETHOD:#{req.method}\nURI:#{req.path}\n#{res.body}")
      raise e
    end
  end
end

db = Couch::Server.new("ec2-67-202-28-227.compute-1.amazonaws.com", 5984, "quadtech", "fcfcqqq1901")
json = JSON.parse db.get("/posters/_design/app/_view/byCollection").body
json['rows'].each do |entry|
  if entry['key'] == 'tasks' or entry['value']['type'] == 'task'
    uri = "/posters/#{entry['id']}?rev=#{entry['value']['_rev']}"
    pp "Deleting #{uri}"
    db.delete uri
  end
end

DATA.each_line do |line|
  line.strip!
  names, locs = line.split(' - ', 2)
  json = <<-JSON
    {"type":"task","collection":"tasks","title":"#{locs}","assigned":"#{names}"}
  JSON
  json.strip!
  pp "POSTing #{json}"
  db.post '/posters', json
end

__END__
Lucia - Dinkey/Forbes
JWang - Frist, paths between Woolworth & 1879 hall
Chloe - Spelman, also pathway between Spelman and Dillon
Cody - walkway from Whitman to bio labs
Ryan - 1903 and adjacent courtyard (between 1903 and Frist), Cuyler
Nan - N Whitman (including Elm st. and road between whit and Dillon)
Matt - S. Whitman (including Elm st and road to south) and New South
Diana, Tina - Wilson (including wilcox) - talk to each other to split
Banke, Kyle - Butler (including Wu, but not Bloomberg) - talk to each other to split
Bryan - Bloomberg/Scully
Maya - Mathey
Bassam - Path from U-store to Washington rd
Brenton - Path from Robertson to E-Quad
Julia - Prospect Ave (both sides!)
Lucy - Brown, Dod, Little/Dillon courtyard
Dave - McCosh courtyard + Firestone
Katie - Rocky