package services;

import java.net.URL;
import java.util.Objects;

public record Endpoint(String url, int port) {
//    public Endpoint(String url, int port) {
//        this.port = port;
//        setUrl(url);
//    }
//
//    private URL url;
//    private int port;

//    public int getPort() {
//        return port;
//    }
//
//    public void setPort(int port) {
//        this.port = port;
//    }

//    public URL getUrl() {
//        return url;
//    }
//
//    public void setUrl(String url) {
//        try {
//            setUrl(new URL(url));
//        } catch(Exception e) {
//            this.url = null;
//        }
//    }
//    private void setUrl(URL url) {
//        this.url = url;
//    }
//
//    @Override
//    public String toString() {
//        return this.url == null ? null : this.url.toString();
//    }
//
//    @Override
//    public boolean equals(Object o) {
//        if (this == o) return true;
//        if (o == null || getClass() != o.getClass()) return false;
//        Endpoint endpoint = (Endpoint) o;
//        return Objects.equals(url, endpoint.url);
//    }
}
