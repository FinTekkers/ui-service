package services;

import java.net.URL;
import java.util.Objects;

public class Endpoint {
    public Endpoint(String url) {
        setUrl(url);
    }

    private URL url;

    public URL getUrl() {
        return url;
    }

    public void setUrl(String url) {
        try {
            setUrl(new URL(url));
        } catch(Exception e) {
            this.url = null;
        }
    }
    private void setUrl(URL url) {
        this.url = url;
    }

    @Override
    public String toString() {
        return this.url == null ? null : this.url.toString();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Endpoint endpoint = (Endpoint) o;
        return Objects.equals(url, endpoint.url);
    }
}
