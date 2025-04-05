package cn.bklovezz.api.invokegrpcstudentclient.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubspot.jackson.datatype.protobuf.ProtobufModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // SimpleModule module = new SimpleModule();
        // module.addSerializer(UnknownFieldSet.class, new ProtobufSerializer()); // 添加自定义序列化器（如果需要）
        mapper.registerModule(new ProtobufModule()); // 注册protobuf模块
        return mapper;
    }

//    @Bean
//    public ObjectMapper objectMapper() {
//        ObjectMapper objectMapper = new ObjectMapper();
//        SimpleModule module = new SimpleModule();
//        module.addSerializer(UnknownFieldSet.class, new UnknownFieldSetSerializer());
//        objectMapper.registerModule(module);
//        return objectMapper;
//    }
//
//    public static class UnknownFieldSetSerializer extends JsonSerializer<UnknownFieldSet> {
//        @Override
//        public void serialize(UnknownFieldSet unknownFieldSet, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
//            // 自定义序列化逻辑
//            jsonGenerator.writeString("Custom serialized value");
//        }
//    }
}
